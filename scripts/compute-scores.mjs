#!/usr/bin/env node
/**
 * compute-scores.mjs — 实用五维评分管道（对标 dsh.market 方法论，自有实现）。
 *
 * 输入：public/data/plugins.json + public/readmes/{slug}.md（fetch-readmes.mjs 产物）
 * 输出：public/data/scores.json —— key = repo 小写，value:
 *   { t: 总分0-100, m: 维护, p: 实用, h: 热度, e: 便捷, s: 信号, conf: 置信度0-1, exp: 中文一句话理由 }
 *
 * 五维（权重与几何平均融合，任一维度差都会显著拉低总分）：
 *   m 维护活跃 30% — pushed_at 距数据更新日的天数衰减（≤7天≈满分）
 *   p 实用度   25% — 本地 README 结构分析（安装/使用章节、代码块、篇幅）
 *   h 生态热度 20% — stars 对数归一化（全库 p99 动态基准）+ fork 参与率 Wilson 下界修正
 *   e 便捷度   15% — 标准 dsh 安装命令 + README 明确安装方式 + 无需 API Key 等额外配置
 *   s 信号质量 10% — 双语描述 / license / topics / README 完备度
 *
 * 置信度（贝叶斯降权）：信息不全（无 README / 无 pushed_at）或新库（≤30天且<5★）时
 * 向先验 40 分收缩，避免样本少导致分数虚高。
 *
 * 纯本地计算（零 GitHub API），可随每日 CI 幂等重跑。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SITE_JSON = fileURLToPath(new URL('../public/data/plugins.json', import.meta.url))
const README_DIR = fileURLToPath(new URL('../public/readmes/', import.meta.url))
const OUT_JSON = fileURLToPath(new URL('../public/data/scores.json', import.meta.url))

const site = JSON.parse(readFileSync(SITE_JSON, 'utf8'))
const baseDate = new Date(site.updatedAt)

// ---------- 热度维度动态基准：全库 stars 的 p99 ----------
const sortedStars = site.plugins.map(p => p.stars ?? 0).sort((a, b) => a - b)
const p99 = sortedStars[Math.floor(sortedStars.length * 0.99)] || 100
const LOG_P99 = Math.log10(p99 + 1)

/** Wilson 95% 下界（fork 参与率的稳健估计） */
function wilsonLower(k, n) {
  if (n <= 0) return 0
  const z = 1.96
  const p = k / n
  const denom = 1 + (z * z) / n
  const centre = p + (z * z) / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return Math.max(0, (centre - margin) / denom)
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
const r0 = x => Math.round(clamp(x, 0, 100))

// ---------- 各维度 ----------
function scoreMaintain(p) {
  if (!p.pushed_at) return { v: 10, days: null }
  const days = Math.max(0, Math.round((baseDate - new Date(p.pushed_at)) / 86400000))
  // ≤7天≈100，90天≈70，180天≈40，一年≈8
  return { v: r0(Math.max(8, 100 - Math.pow(days, 1.15) * 0.42)), days }
}

function scorePractical(readme) {
  if (!readme) return 15
  const lower = readme.toLowerCase()
  let v = 10
  if (/^#{1,4} *(安装|install|快速开始|quick[- ]?start|getting started)/im.test(readme)) v += 35
  if (/^#{1,4} *(使用|用法|usage|示例|example|功能|features?)/im.test(readme)) v += 25
  const fences = (readme.match(/```/g) || []).length / 2
  if (fences >= 3) v += 25
  else if (fences >= 1) v += 14
  if (readme.length >= 2048) v += 15
  else if (readme.length >= 512) v += 8
  return r0(v)
}

function scoreHeat(p) {
  const stars = p.stars ?? 0
  const forks = p.forks ?? 0
  const hStars = 100 * Math.min(1, Math.log10(stars + 1) / LOG_P99)
  const forkWilson = wilsonLower(forks, stars + forks) // 健康生态 fork 占比 ~5-10%
  const hFork = Math.min(100, forkWilson * 800)
  return r0(0.8 * hStars + 0.2 * hFork)
}

function scoreEase(p, readme) {
  let v = 10
  if (/^dsh (plugin|skill)/.test(p.install_cmd || '') || /dsh plugin add/.test(p.install_cmd || '')) v += 45
  else if (p.install_cmd) v += 25
  if (readme && /(dsh plugin add|pnpm (add|dlx)|npm (i|install)|npx |git clone)/i.test(readme)) v += 25
  // README 要求 API Key / .env / token 配置的扣便捷分
  const needsKey = readme && /(api[_ -]?key|需要.*(密钥|令牌)|create a .*\.env|设置.*api)/i.test(readme)
  if (!needsKey) v += 20
  return r0(v)
}

function scoreSignal(p, readme) {
  let v = 0
  if (p.description_zh) v += 20
  if (p.description_en) v += 20
  if (p.license) v += 20
  if ((p.topics || []).length) v += 15
  if (readme) v += 25
  return r0(v)
}

/** 加权几何平均（维度先 clamp 到 ≥1，避免单项 0 直接归零总分） */
function geoMean(dims) {
  const weights = { m: 0.30, p: 0.25, h: 0.20, e: 0.15, s: 0.10 }
  let logSum = 0
  for (const k of Object.keys(weights)) logSum += weights[k] * Math.log10(Math.max(1, dims[k]))
  return r0(Math.pow(10, logSum))
}

/** 中文一句话理由（取最强信号，与竞品「解释层」同思路） */
function explain(p, dims, mDays) {
  const parts = []
  if (mDays !== null && dims.m >= 85) parts.push(`近 ${mDays} 天仍在更新`)
  else if (mDays !== null && dims.m < 40) parts.push(`已 ${mDays} 天未更新`)
  if (dims.p >= 80) parts.push('README 含完整安装与使用说明')
  else if (dims.p < 40) parts.push('文档较简略')
  if (dims.h >= 80) parts.push(`${(p.stars ?? 0).toLocaleString('en-US')} stars 社区认可度高`)
  else if ((p.stars ?? 0) > 0 && dims.h < 30) parts.push(`关注度尚低（${p.stars}★）`)
  if (dims.e >= 90) parts.push('标准命令一键安装')
  else if (dims.e < 50) parts.push('安装需额外配置')
  if (!parts.length) parts.push('基础信息完整，可按需选装')
  return parts.slice(0, 3).join('；') + '。'
}

// ---------- 主循环 ----------
const out = {}
let noReadme = 0
for (const p of site.plugins) {
  const readmePath = `${README_DIR}${p.slug}.md`
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : null
  if (!readme) noReadme++

  const { v: m, days } = scoreMaintain(p)
  const dims = { m, p: scorePractical(readme), h: scoreHeat(p), e: scoreEase(p, readme), s: scoreSignal(p, readme) }

  const raw = geoMean(dims)
  let conf = 1
  if (!readme) conf -= 0.3
  if (!p.pushed_at) conf -= 0.2
  if (days !== null && days <= 30 && (p.stars ?? 0) < 5) conf -= 0.25
  conf = clamp(conf, 0.25, 1)
  const t = r0(conf * raw + (1 - conf) * 40)

  out[p.repo.toLowerCase()] = {
    t, m: dims.m, p: dims.p, h: dims.h, e: dims.e, s: dims.s,
    conf: Math.round(conf * 100) / 100,
    exp: explain(p, dims, days),
  }
}

const payload = { updatedAt: new Date().toISOString().slice(0, 10), count: Object.keys(out).length, scores: out }
writeFileSync(OUT_JSON, JSON.stringify(payload, null, 1) + '\n')

// ---------- 报表 ----------
const entries = Object.values(out)
const dist = { '90+': 0, '70-89': 0, '50-69': 0, '<50': 0 }
entries.forEach(x => { if (x.t >= 90) dist['90+']++; else if (x.t >= 70) dist['70-89']++; else if (x.t >= 50) dist['50-69']++; else dist['<50']++ })
console.log('=== 评分完成 ===')
console.log('插件数:', entries.length, '| 无 README(降置信):', noReadme, '| stars p99 基准:', p99)
console.log('分档分布:', JSON.stringify(dist))
console.log('=== 总分 top15 ===')
const byRepo = Object.entries(out).sort((a, b) => b[1].t - a[1].t).slice(0, 15)
for (const [repo, x] of byRepo) console.log(`  ${String(x.t).padStart(3)}  ${repo}  m${x.m}/p${x.p}/h${x.h}/e${x.e}/s${x.s} conf${x.conf}  ${x.exp}`)
console.log('已写入', OUT_JSON)
