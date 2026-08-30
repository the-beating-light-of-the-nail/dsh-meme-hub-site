import data from '~/public/data/plugins.json'

/** 仓库截图条目（raw.githubusercontent 固定 commit，w/h 可为 null） */
export interface PluginScreenshot {
  url: string
  w?: number | null
  h?: number | null
}

export interface DshPlugin {
  slug: string
  name: string
  repo: string
  url: string
  description_zh: string
  description_en: string
  /** 繁體版（scripts/gen-zh-tw.mjs 由 *_zh 转换注入，缺省回退简体） */
  description_zh_TW?: string
  stars: number
  forks?: number
  category_zh: string
  category_en: string
  category_zh_TW?: string
  is_meme: boolean
  meme_section?: 'absurd' | 'skins' | 'pets' | 'slackoff' | 'useful' | 'textclub'
  meme_caption_zh?: string
  meme_caption_en?: string
  meme_caption_zh_TW?: string
  image: string | null
  /** 图片真实像素宽高(scripts/set-image-dims.mjs 回填,<img> 预留布局防 CLS) */
  image_w?: number
  image_h?: number
  /** 自动抓取的仓库截图（scripts/fetch-screenshots.mjs 生成，raw.githubusercontent 固定 commit） */
  screenshots?: PluginScreenshot[]
  install_cmd: string
  video_url?: string
  pushed_at: string
  license?: string | null
  language?: string | null
  has_manifest: boolean
  topics: string[]
}

interface PluginData {
  updatedAt: string
  count: number
  plugins: DshPlugin[]
}

const pluginData = data as unknown as PluginData

// 数据管道对 GitHub API 抓取失败的条目会写 null（stars/forks/pushed_at 等）。
// 在加载层归一化为安全值：模板里的 stars.toLocaleString()、fresh() 的 pushed_at
// 排序等才不会在 SSR 抛错（null.toLocaleString() 曾致 84 插件 × 4 语言共 336 条
// 路由 prerender 500，nitro "Exiting due to prerender errors" 构建中断）。
const normalizedPlugins: DshPlugin[] = pluginData.plugins.map((p) => ({
  ...p,
  stars: p.stars ?? 0,
  forks: p.forks ?? 0,
  pushed_at: p.pushed_at ?? '',
  topics: p.topics ?? [],
}))

/** 分类 emoji 映射（首页分类网格 & 卡片 chip 用）。'文字选手' 为 meme_section 预留键，勿删 */
const CATEGORY_EMOJI: Record<string, string> = {
  '抽象整活': '🤯', '换皮肤色': '🎨', '赛博宠物': '🐳', '摸鱼游戏': '🎮',
  '文字选手': '📝', 'UI 增强': '✨', '工具与集成': '🧰', 'Agent 与自动化': '🤖',
  '客户端与终端': '🖥️', '视觉与多模态': '👁️', '记忆与知识': '🧠',
  '生态与开发': '🧭', '安全与运维': '🛡️',
  '会话与消息': '💬', '娱乐': '🎲',
  '股票金融': '📈',
}

export function usePlugins() {
  const plugins: DshPlugin[] = normalizedPlugins

  /**
   * 当前 locale 下分类字段选择器。
   * zh-TW：繁體字段（gen-zh-tw 注入）→ 简体回退；de 及其他：英文。
   */
  const catOf = (p: DshPlugin, locale: string) => {
    if (locale === 'zh-TW') return p.category_zh_TW ?? p.category_zh
    if (locale === 'zh') return p.category_zh
    return p.category_en
  }

  const descOf = (p: DshPlugin, locale: string) => {
    if (locale === 'zh-TW') return p.description_zh_TW ?? p.description_zh
    if (locale === 'zh') return p.description_zh
    return p.description_en
  }

  const captionOf = (p: DshPlugin, locale: string) => {
    if (locale === 'zh-TW') return p.meme_caption_zh_TW ?? p.meme_caption_zh ?? ''
    if (locale === 'zh') return p.meme_caption_zh ?? ''
    return p.meme_caption_en ?? ''
  }

  const emojiOf = (p: DshPlugin) => CATEGORY_EMOJI[p.category_zh] ?? '🧩'

  const byStars = () => [...plugins].sort((a, b) => b.stars - a.stars)

  const memes = () => plugins.filter((p) => p.is_meme)

  /**
   * 最近 N 天内有推送的，按 pushed_at 倒序。
   * 以数据更新日期（updatedAt）为基准，保证 SSR/客户端预渲染水合一致；
   * 数据久未刷新时该区块可能长期显示同一批，需通过 build:data 刷新。
   */
  const fresh = (days = 7) => {
    const cutoff = new Date(pluginData.updatedAt)
    cutoff.setDate(cutoff.getDate() - days)
    const iso = cutoff.toISOString().slice(0, 10)
    return plugins.filter((p) => p.pushed_at && p.pushed_at >= iso)
      .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1))
  }

  /** 分类聚合（按 locale 取名），按数量倒序 */
  const categories = (locale: string) => {
    const map = new Map<string, { key: string; label: string; emoji: string; count: number }>()
    for (const p of plugins) {
      const label = catOf(p, locale)
      const key = p.category_zh // stable key regardless of locale
      const cur = map.get(key) ?? { key, label, emoji: emojiOf(p), count: 0 }
      cur.count++
      cur.label = label
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }

  const bySlug = (slug: string) => plugins.find((p) => p.slug === slug)

  const related = (p: DshPlugin, n = 4) =>
    plugins.filter((x) => x.slug !== p.slug && x.category_zh === p.category_zh)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, n)

  const totalStars = () => plugins.reduce((s, p) => s + p.stars, 0)

  /** 搜索 + 筛选 + 排序（/plugins 页用） */
  function query(opts: {
    q?: string
    categoryKey?: string // category_zh（稳定 key）
    memeSection?: string
    sort?: 'stars' | 'recent' | 'name'
  }): DshPlugin[] {
    let list = [...plugins]
    if (opts.memeSection) {
      list = list.filter((p) => p.is_meme && (opts.memeSection === 'all' || p.meme_section === opts.memeSection))
    }
    if (opts.categoryKey && opts.categoryKey !== 'all') {
      list = list.filter((p) => p.category_zh === opts.categoryKey)
    }
    const q = (opts.q ?? '').trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q)
        || p.repo.toLowerCase().includes(q)
        || p.description_zh.toLowerCase().includes(q)
        || p.description_en.toLowerCase().includes(q)
        || (p.meme_caption_zh ?? '').toLowerCase().includes(q)
        || (p.meme_caption_en ?? '').toLowerCase().includes(q)
        || p.topics.some((t) => t.toLowerCase().includes(q)))
    }
    switch (opts.sort) {
      case 'recent':
        list.sort((a, b) => ((a.pushed_at || '') < (b.pushed_at || '') ? 1 : -1))
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        list.sort((a, b) => b.stars - a.stars)
    }
    return list
  }

  return {
    plugins,
    updatedAt: pluginData.updatedAt,
    catOf,
    descOf,
    captionOf,
    emojiOf,
    byStars,
    memes,
    fresh,
    categories,
    bySlug,
    related,
    totalStars,
    query,
  }
}

/** 本地收藏（点赞）：localStorage 计数，无后端 */
export function useLikes() {
  const KEY = 'dshmeme_likes_v1'
  const counts = useState<Record<string, number>>(KEY, () => ({}))
  const mine = useState<Set<string>>(`${KEY}_mine`, () => new Set())

  const load = () => {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const obj = JSON.parse(raw)
          counts.value = obj.counts ?? {}
          mine.value = new Set(obj.mine ?? [])
        }
      }
      catch {}
    }
  }

  const persist = () => {
    if (import.meta.client) {
      localStorage.setItem(KEY, JSON.stringify({
        counts: counts.value,
        mine: [...mine.value],
      }))
    }
  }

  const toggle = (slug: string) => {
    const c = { ...counts.value }
    c[slug] = Math.max(0, (c[slug] ?? 0) + (mine.value.has(slug) ? -1 : 1))
    counts.value = c
    const m = new Set(mine.value)
    m.has(slug) ? m.delete(slug) : m.add(slug)
    mine.value = m
    persist()
  }

  /** 展示用计数：本地赞 + star 数 /100 向下取整的种子底数（让卡片不至于全是 0） */
  const countOf = (slug: string, seed = 0) =>
    (counts.value[slug] ?? 0) + seed

  const liked = (slug: string) => mine.value.has(slug)

  return { load, toggle, countOf, liked }
}
