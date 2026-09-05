#!/usr/bin/env node
// 为 public/data/plugins.json 里每个插件抓取 GitHub 仓库预览截图(最多 6 张),
// 写入新增字段 screenshots: [{ url, w, h }](w/h 暂留 null,不做尺寸探测)。
// 不修改任何现有字段;幂等,重跑只覆盖 screenshots。
//
// 抓图链路(逐 repo):
//   1. git ls-remote 取 HEAD 的 40 位 commit SHA(child_process,无 API 速率限制)
//   2. 抓 raw.githubusercontent.com/{repo}/{SHA}/README.md 与 README.zh.md
//   3. 提取 Markdown ![](url) 与 <img src="..."> 两种语法里的图片
//   4. 过滤 .svg / shields.io / star-history.com / badge 徽章图
//   5. 相对路径拼成 raw 绝对地址;同仓库 raw/blob 链接把分支名换成 SHA(防改名裂图);
//      其余绝对 https 链接原样保留
//   6. README 提取不足 6 张时,逐个 HEAD 探测约定文件名(content-type 以 image/ 开头才算存在)
//   7. 全部落空 → 兜底 opengraph.githubassets.com/{SHA}/{repo}(GitHub 自动生成的社交封面)
//
// monorepo 子包:repo 字段形如 owner/name#packages/foo 时,README 与约定文件名都从子包
// 目录起算(与 fetch-readmes.mjs 同款约定),ls-remote/opengraph 只用 owner/name 部分。
//
// 失败语义(对齐 refresh-stars.py):单仓失败只记原因,保留该插件现有 screenshots 不清空——
// 整体覆盖只发生在收集成功时,网络抖动/仓库改名不会抹掉已有截图。
//
// 本机访问 GitHub 必须走 sing-box 代理;Node 内置 fetch 不读 HTTP_PROXY 环境变量,
// 故依赖 undici 的 ProxyAgent(setGlobalDispatcher)。git 同样不读环境变量代理,
// ls-remote 时以 -c http.proxy=... 显式传入。单个 repo 失败只记失败原因,绝不中断整体。
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DATA_FILE = resolve(import.meta.dirname, '../public/data/plugins.json')
// GITHUB_DIRECT=1 时强制不走代理(GitHub Actions runner 直连;本机默认走 sing-box)
const PROXY = process.env.GITHUB_DIRECT ? '' : (process.env.HTTP_PROXY || process.env.http_proxy || 'http://127.0.0.1:7890')
const TIMEOUT_MS = 20_000
const CONCURRENCY = 8
const MAX_SHOTS = 6
const RAW_BASE = 'https://raw.githubusercontent.com'
const OG_BASE = 'https://opengraph.githubassets.com'
const README_FILES = ['README.md', 'README.zh.md']
// 约定文件名探测顺序,HEAD 逐个试
const CONVENTIONAL_FILES = [
  'preview.webp', 'preview.png',
  'screenshot.webp', 'screenshot.png',
  'docs/preview.webp', 'docs/preview.png',
  'assets/preview.webp', 'assets/preview.png',
]

// undici 的 fetch 与全局 fetch 同 API,但确保请求经过上面的 ProxyAgent
let ProxyAgent, setGlobalDispatcher, fetchViaProxy
try {
  ({ ProxyAgent, setGlobalDispatcher, fetch: fetchViaProxy } = await import('undici'))
}
catch {
  console.error('缺少依赖 undici(本机走代理抓 GitHub 必需):请先运行 npm i -D undici')
  process.exit(1)
}
if (PROXY) setGlobalDispatcher(new ProxyAgent(PROXY))

/** execFile 的 Promise 包装,出错时优先带出 stderr */
const execFileP = (cmd, args, opts) => new Promise((resolveP, rejectP) => {
  execFile(cmd, args, opts, (err, stdout, stderr) => {
    if (err) rejectP(new Error(stderr?.trim() || err.message))
    else resolveP(stdout)
  })
})

/** 取 repo HEAD 的完整 40 位 commit SHA;git 需显式传代理 */
async function headSha(repo) {
  const args = []
  if (PROXY) args.push('-c', `http.proxy=${PROXY}`)
  args.push('ls-remote', `https://github.com/${repo}.git`, 'HEAD')
  const out = await execFileP('git', args, { timeout: TIMEOUT_MS })
  const sha = (out.trim().split(/\s+/)[0] || '')
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`ls-remote 无有效 HEAD: ${out.trim().slice(0, 60)}`)
  return sha
}

/** 抓文本;404/5xx 一律视作无内容,网络错误也吞掉(该来源贡献 0 张图) */
async function fetchText(url) {
  try {
    const res = await fetchViaProxy(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    return res.ok ? await res.text() : ''
  }
  catch {
    return ''
  }
}

// Markdown ![alt](url "title") 与 <img src="url">;Markdown 尖括号形式 ![x](<a b.png>) 也吃
const MD_IMG_RE = /!\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g
const HTML_IMG_RE = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi

function extractImageUrls(text) {
  const urls = []
  for (const m of text.matchAll(MD_IMG_RE)) urls.push(m[1])
  for (const m of text.matchAll(HTML_IMG_RE)) urls.push(m[1])
  return urls
}

/** 徽章/图标类:svg、shields 徽章、star-history 趋势图等 */
function isBadgeOrIcon(url) {
  const s = url.toLowerCase()
  return s.endsWith('.svg') || s.includes('shields.io') || s.includes('star-history.com') || s.includes('badge')
}

/**
 * URL 归一化(防裂图):
 *   - 相对路径 → raw.githubusercontent.com/{repo}/{SHA}/{baseDir + path}(README 所在目录起算)
 *   - 同仓库 raw 链接 / github blob 链接 → 分支名替换为 SHA(路径是仓库绝对路径,不叠 baseDir)
 *   - 其余绝对 https 链接原样保留;其余协议、锚点、data: 一律丢弃
 * @returns {string|null}
 */
function normalizeImageUrl(rawUrl, repo, sha, baseDir = '') {
  let u = rawUrl.trim()
  if (u.startsWith('<') && u.endsWith('>')) u = u.slice(1, -1)
  if (!u || u.startsWith('#') || u.startsWith('data:')) return null
  if (u.startsWith('//')) return `https:${u}`

  if (/^https?:\/\//i.test(u)) {
    // 同仓库 raw: https://raw.githubusercontent.com/{repo}/{branch}/{path}
    const rawPrefix = `https://raw.githubusercontent.com/${repo.toLowerCase()}/`
    if (u.toLowerCase().startsWith(rawPrefix)) {
      const rest = u.slice(rawPrefix.length)
      const slash = rest.indexOf('/')
      if (slash > 0) return `${RAW_BASE}/${repo}/${sha}/${rest.slice(slash + 1)}`
    }
    // 同仓库 blob 页: https://github.com/{repo}/blob/{branch}/{path} → raw + SHA
    const blobPrefix = `https://github.com/${repo.toLowerCase()}/blob/`
    if (u.toLowerCase().startsWith(blobPrefix)) {
      const rest = u.slice(blobPrefix.length)
      const slash = rest.indexOf('/')
      if (slash > 0) return `${RAW_BASE}/${repo}/${sha}/${rest.slice(slash + 1)}`
    }
    return u
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null // mailto: ftp: 等其它协议

  // 仓库内相对路径:先落子包基路径(monorepo),再逐段消解 ./ ../,含空格/中文的段做百分号编码
  const segs = []
  for (const seg of baseDir.split('/')) if (seg) segs.push(seg)
  for (const seg of u.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') { segs.pop(); continue }
    segs.push(/[^\w.\-~()%]/.test(seg) ? encodeURIComponent(seg) : seg)
  }
  return segs.length ? `${RAW_BASE}/${repo}/${sha}/${segs.join('/')}` : null
}

/** 逐个 HEAD 探测约定文件名,content-type 以 image/ 开头才算存在 */
async function probeConventional(repo, sha, baseDir = '') {
  const found = []
  const prefix = baseDir ? `${baseDir}/` : ''
  for (const file of CONVENTIONAL_FILES) {
    const url = `${RAW_BASE}/${repo}/${sha}/${prefix}${file}`
    try {
      const res = await fetchViaProxy(url, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (res.ok && (res.headers.get('content-type') || '').toLowerCase().startsWith('image/')) found.push(url)
    }
    catch { /* 探测失败当不存在,继续下一个 */ }
  }
  return found
}

/** 单个 repo 的完整抓图流程,返回 { screenshots, via };repo 形如 owner/name 或 owner/name#sub/dir */
async function collectScreenshots(repoField) {
  const hashIdx = repoField.indexOf('#')
  const repo = hashIdx >= 0 ? repoField.slice(0, hashIdx) : repoField
  const baseDir = hashIdx >= 0 ? repoField.slice(hashIdx + 1) : ''
  const readmePrefix = baseDir ? `${baseDir}/` : ''
  const sha = await headSha(repo)
  const shots = []
  const seen = new Set()
  const add = (url) => {
    if (!url || seen.has(url) || isBadgeOrIcon(url)) return
    seen.add(url)
    shots.push(url)
  }

  for (const file of README_FILES) {
    const text = await fetchText(`${RAW_BASE}/${repo}/${sha}/${readmePrefix}${file}`)
    for (const u of extractImageUrls(text)) add(normalizeImageUrl(u, repo, sha, baseDir))
  }
  let via = shots.length ? 'readme' : ''

  if (shots.length < MAX_SHOTS) {
    const before = shots.length
    for (const url of await probeConventional(repo, sha, baseDir)) add(url)
    if (shots.length > before) via = via ? `${via}+probe` : 'probe'
  }

  if (shots.length === 0) {
    add(`${OG_BASE}/${sha}/${repo}`) // GitHub 自动生成,必然存在,无需校验
    via = 'opengraph'
  }

  return { screenshots: shots.slice(0, MAX_SHOTS).map(url => ({ url, w: null, h: null })), via }
}

// ---- 主流程:8 路并发池,逐 repo 覆盖 screenshots ----
const raw = await readFile(DATA_FILE, 'utf8')
const data = JSON.parse(raw)
const plugins = data.plugins
console.log(`${DATA_FILE}: ${plugins.length} 个插件,代理 ${PROXY || '(无)'},并发 ${CONCURRENCY}`)

const failures = []
let done = 0
let cursor = 0

async function worker() {
  for (;;) {
    const i = cursor++
    if (i >= plugins.length) return
    const plugin = plugins[i]
    const tag = () => `[${String(done + 1).padStart(3)}/${plugins.length}]`
    try {
      const { screenshots, via } = await collectScreenshots(plugin.repo)
      plugin.screenshots = screenshots // 幂等:整体覆盖,不累计
      console.log(`${tag()} ${plugin.repo} → ${screenshots.length} 张 (${via})`)
    }
    catch (err) {
      // 失败保留现有 screenshots(与 refresh-stars.py 的「沿用旧值」语义对齐),只记失败原因
      const reason = err?.message || String(err)
      failures.push({ repo: plugin.repo, reason })
      console.log(`${tag()} ${plugin.repo} → 保留原有 ${plugin.screenshots?.length || 0} 张 (失败: ${reason})`)
    }
    done++
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, plugins.length) }, worker))

// 熔断:失败过半说明代理/GitHub 整体抽风,此时写盘会把既有截图清空再被 CI 自动
// commit 回 master —— 宁可直接失败退出,也不产出全空数据。
if (failures.length > plugins.length / 2) {
  console.error(`失败 ${failures.length}/${plugins.length} 过半,疑似网络整体故障;为防清空既有截图,本次不写盘`)
  process.exit(1)
}

// 与既有数据文件保持同款格式(1 空格缩进 + 结尾换行),除新增字段外零 diff
await writeFile(DATA_FILE, JSON.stringify(data, null, 1) + (raw.endsWith('\n') ? '\n' : ''))

// ---- 统计 ----
const withShots = plugins.filter(p => Array.isArray(p.screenshots) && p.screenshots.length > 0)
const total = plugins.reduce((n, p) => n + (p.screenshots?.length || 0), 0)
const dist = {}
for (const p of plugins) {
  const k = String(p.screenshots?.length ?? 0)
  dist[k] = (dist[k] || 0) + 1
}
console.log('—— 完成 ——')
console.log(`拿到截图的插件: ${withShots.length}/${plugins.length},截图总数 ${total}`)
console.log(`张数分布(张:插件数): ${Object.keys(dist).sort((a, b) => a - b).map(k => `${k}:${dist[k]}`).join('  ')}`)
if (failures.length) {
  console.log(`失败 ${failures.length} 个:`)
  for (const f of failures) console.log(`  - ${f.repo}: ${f.reason}`)
}
