#!/usr/bin/env node
/**
 * import-dshmarket.mjs — 从竞品 dsh.market（github.com/2BingLing/dsh-market，MIT）
 * 的公开数据 https://dsh.market/plugins.json 批量导入我们缺失的插件。
 * 用户决策 2026-09-11：全量分批镜像（他收录的我也要收录），批1 ≥50★。
 *
 * 用法：
 *   node scripts/import-dshmarket.mjs --dry-run --min-stars 50   # 预览
 *   node scripts/import-dshmarket.mjs --min-stars 50             # 写入
 *
 * 映射规则：
 *  - 去重：他们 fullName(小写) 对比我们 repo(小写，剥 #path 子包后缀)；
 *    我们已有该仓库任意子包条目也视为已覆盖（同一项目不重复建页）
 *  - 描述：description_zh=descriptionZh（他们每日管道的 AI 中文化，覆盖率 99.98%），
 *    description_en=description，缺失时回退中文
 *  - 分类：他们中文功能 tags → 本站 16 类精确值（TAG_MAP 优先级表），
 *    无命中再按 name/desc 关键词兜底，默认「工具与集成」
 *  - 繁体 *_zh_TW 用 opencc-js s2twp 只转换新条目（绝不动既有条目）
 *  - slug 冲突 → 加 owner 前缀；slug 仅 [A-Za-z0-9._-]
 *  - has_manifest = (type === 'cordis-plugin')；skill 型为 SKILL.md 形态非 manifest
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import OpenCC from 'opencc-js'

const SITE_JSON = fileURLToPath(new URL('../public/data/plugins.json', import.meta.url))
const CATEGORY_CFG = fileURLToPath(new URL('../data/seo/category-pages.json', import.meta.url))
const SOURCE_URL = 'https://dsh.market/plugins.json'

const dryRun = process.argv.includes('--dry-run')
const minStarsArg = process.argv.find(a => a.startsWith('--min-stars'))
const MIN_STARS = minStarsArg ? Number(minStarsArg.split('=')[1] ?? minStarsArg.split(' ')[1] ?? 50) : 50

const convert = OpenCC.Converter({ from: 'cn', to: 'twp' })

// 他们中文功能 tag → 本站 16 类（category_zh 精确值）。顺序即优先级：
// 越具体的垂类放越前（如 桌面宠物/主题 必须先于宽泛的 效率提升 命中）。
const TAG_MAP = [
  ['桌面宠物', '赛博宠物'],
  ['娱乐互动', '娱乐'],
  ['主题', '换皮肤色'],
  ['多模态', '视觉与多模态'],
  ['语义检索', '记忆与知识'],
  ['会话管理', '会话与消息'], ['消息通知', '会话与消息'],
  ['安全审计', '安全与运维'], ['状态监控', '安全与运维'],
  ['命令行工具', '客户端与终端'],
  ['多Agent协作', 'Agent 与自动化'], ['任务编排', 'Agent 与自动化'],
  ['自动化', 'Agent 与自动化'], ['工作流增强', 'Agent 与自动化'], ['AI 助手', 'Agent 与自动化'],
  ['可视化', 'UI 增强'], ['前端增强', 'UI 增强'], ['界面美化', 'UI 增强'], ['web-ui', 'UI 增强'], ['设置面板', 'UI 增强'],
  ['工作区管理', '生态与开发'], ['开发流程', '生态与开发'], ['agent-skills', '生态与开发'],
  ['skills', '生态与开发'], ['dsh-skill', '生态与开发'], ['developer-tools', '生态与开发'], ['coding-agent', '生态与开发'],
  ['效率提升', '工具与集成'], ['零配置', '工具与集成'], ['插件管理', '工具与集成'],
  ['模型配置', '工具与集成'], ['工具集成', '工具与集成'], ['文件管理', '工具与集成'],
  ['资源优化', '工具与集成'], ['AI工具', '工具与集成'], ['模型适配', '工具与集成'], ['mcp', '工具与集成'],
]

// name/desc/topics 关键词兜底（正则，忽略大小写），顺序即优先级
const KEYWORD_MAP = [
  [/sillytavern|酒馆|角色扮演|roleplay/, '酒馆与角色扮演'],
  [/股票|炒股|交易终端|crypto|trading|quant|金融/, '股票金融'],
  [/摸鱼|game|游戏/, '摸鱼游戏'],
  [/pet|宠物/, '赛博宠物'],
  [/skin|皮肤|壁纸|wallpaper|theme/, '换皮肤色'],
  [/vision|ocr|截图|screenshot|多模态|看图|图像|图片/, '视觉与多模态'],
  [/memory|记忆|知识库|知识/, '记忆与知识'],
  [/tui|终端|terminal|desktop|桌面|客户端|client/, '客户端与终端'],
  [/pentest|红队|red.?team|越狱|jailbreak|安全|审计|monitor|监控/, '安全与运维'],
  [/session|会话|notify|通知|微信|wechat|im-|消息/, '会话与消息'],
  [/agent|自动化|automation|workflow|工作流|subagent/, 'Agent 与自动化'],
  [/sidebar|ui|界面|面板|panel|web/, 'UI 增强'],
  [/mcp|api|tool|工具|集成/, '工具与集成'],
]

function classify(p) {
  for (const [tag, cat] of TAG_MAP) {
    if ((p.tags || []).includes(tag)) return cat
  }
  const hay = `${p.name} ${p.descriptionZh || ''} ${p.description || ''} ${(p.topics || []).join(' ')}`.toLowerCase()
  for (const [re, cat] of KEYWORD_MAP) {
    if (re.test(hay)) return cat
  }
  return '工具与集成'
}

// slug 清洗：仅 [A-Za-z0-9._-]，其余字符逐段替换为 -
function safeSlug(s) {
  return String(s).trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'plugin'
}

console.log(`拉取 ${SOURCE_URL} (min-stars=${MIN_STARS}${dryRun ? ', dry-run' : ''}) ...`)
const src = await (await fetch(SOURCE_URL)).json()
const source = Array.isArray(src) ? src : src.plugins || []
console.log('源条目:', source.length)

const site = JSON.parse(readFileSync(SITE_JSON, 'utf8'))

// 我们已有的仓库键（owner/name 小写；#path 子包剥掉后缀也算覆盖）
const existingRepoKeys = new Set()
for (const p of site.plugins) {
  if (!p.repo) continue
  existingRepoKeys.add(p.repo.toLowerCase().split('#')[0])
}
const existingSlugs = new Set(site.plugins.map(p => p.slug))

// category_en 从 category-pages.json 取（与 import-awesome 同源）
const cfg = JSON.parse(readFileSync(CATEGORY_CFG, 'utf8'))
const EN_LABELS = {}
for (const c of cfg.categories) EN_LABELS[c.filter.categoryZh[0]] = c.label.en
const TW_LABELS = {}
for (const c of cfg.categories) TW_LABELS[c.filter.categoryZh[0]] = c.label['zh-TW'] || convert(c.filter.categoryZh[0])

const added = []
const skipped = { dup: 0, belowThreshold: 0, noZhDesc: 0 }
const catCount = {}

for (const p of source) {
  const fullName = p.fullName || `${p.owner}/${p.repo}`
  if (!fullName || !fullName.includes('/')) continue
  const key = fullName.toLowerCase()
  if (existingRepoKeys.has(key)) { skipped.dup++; continue }
  if ((p.stars ?? 0) < MIN_STARS) { skipped.belowThreshold++; continue }
  const zh = p.descriptionZh || ''
  if (!zh) { skipped.noZhDesc++; continue }

  const owner = fullName.split('/')[0]
  const name = p.name || fullName.split('/').pop()
  let slug = safeSlug(name)
  if (existingSlugs.has(slug)) slug = safeSlug(`${owner}-${name}`)
  if (existingSlugs.has(slug)) slug = `${slug}-${added.length}` // 极端冲突兜底
  existingSlugs.add(slug)

  const catZh = classify(p)
  const catEn = EN_LABELS[catZh] || 'Tools & Integrations'
  const catTw = TW_LABELS[catZh] || convert(catZh)
  catCount[catZh] = (catCount[catZh] || 0) + 1

  const install = (p.install && p.install.commands && p.install.commands[0])
    || `dsh plugin add github:${fullName}`

  added.push({
    slug,
    name,
    repo: fullName,
    url: `https://github.com/${fullName}`,
    description_zh: zh,
    description_en: p.description || zh,
    stars: p.stars ?? 0,
    forks: p.forks ?? 0,
    category_zh: catZh,
    category_en: catEn,
    is_meme: false,
    meme_section: null,
    meme_caption_zh: '',
    meme_caption_en: '',
    image: null,
    install_cmd: install,
    pushed_at: p.pushedAt ? p.pushedAt.slice(0, 10) : null,
    license: p.license || null,
    language: p.language || null,
    has_manifest: p.type === 'cordis-plugin',
    topics: p.topics || [],
    description_zh_TW: convert(zh),
    category_zh_TW: catTw,
    meme_caption_zh_TW: '',
    screenshots: [],
    auto_ingested: true,
  })
  existingRepoKeys.add(key)
}

console.log('=== 导入' + (dryRun ? '预览' : '完成') + ' ===')
console.log('新增:', added.length, '| 去重跳过:', skipped.dup, '| 低于门槛:', skipped.belowThreshold, '| 无中文描述:', skipped.noZhDesc)
console.log('站点总数:', site.plugins.length, '→', site.plugins.length + added.length)
console.log('=== 新增分类分布 ===')
for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) console.log(`  ${v.toString().padStart(4)}  ${k}`)
console.log('=== 新增 top20（按 stars） ===')
for (const p of [...added].sort((a, b) => b.stars - a.stars).slice(0, 20)) console.log(`  ${p.stars}★  ${p.repo}  [${p.category_zh}]  slug=${p.slug}`)

if (!dryRun && added.length) {
  site.plugins.push(...added)
  site.count = site.plugins.length
  site.updatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(SITE_JSON, JSON.stringify(site, null, 1) + '\n')
  console.log('已写入', SITE_JSON)
}
