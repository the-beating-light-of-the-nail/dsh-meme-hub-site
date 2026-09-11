import type { DshPlugin } from '~/composables/usePlugins'

/** 作者聚合统计（owner = repo 前缀；org 与个人等同呈现） */
export interface AuthorStat {
  owner: string
  count: number
  totalStars: number
  maxStars: number
  /** 该作者全部插件里最近一次推送日期（YYYY-MM-DD，空串表示未知） */
  latestPush: string
  /** 代表作（按 stars 倒序取 3） */
  topPlugins: DshPlugin[]
  /** 综合活跃分：总星对数 ×30 + 插件数加成（封顶 30） + 近期活跃加成（最多 20） */
  activity: number
}

export type AuthorSortKey = 'activity' | 'stars' | 'count'

// 模块级缓存：authors 页 × 4 语种预渲染共享一次聚合（数据构建期静态，无失效问题）
let cached: AuthorStat[] | null = null

export function useAuthors() {
  const { plugins, updatedAt } = usePlugins()

  if (!cached) {
    const map = new Map<string, { plugins: DshPlugin[] }>()
    for (const p of plugins) {
      const owner = p.repo.split('/')[0]
      if (!owner) continue
      const cur = map.get(owner) ?? { plugins: [] }
      cur.plugins.push(p)
      map.set(owner, cur)
    }

    // 活跃度基准日取数据 updatedAt（与 fresh() 同思路）：SSR 与客户端水合两侧
    // 用同一基准，排序/分数不会因构建时刻与访问时刻跨天而漂移
    const baseMs = new Date(updatedAt).getTime()

    cached = [...map.entries()].map(([owner, { plugins: list }]) => {
      const totalStars = list.reduce((s, p) => s + p.stars, 0)
      const sorted = [...list].sort((a, b) => b.stars - a.stars)
      const latestPush = list.reduce((m, p) => (p.pushed_at && p.pushed_at > m ? p.pushed_at : m), '')
      // 近期活跃加成：30 天内有推送 +20，90 天内 +10，半年内 +4
      let recency = 0
      if (latestPush) {
        const days = Math.floor((baseMs - new Date(latestPush).getTime()) / 86400000)
        if (days <= 30) recency = 20
        else if (days <= 90) recency = 10
        else if (days <= 180) recency = 4
      }
      return {
        owner,
        count: list.length,
        totalStars,
        maxStars: sorted[0]?.stars ?? 0,
        latestPush,
        topPlugins: sorted.slice(0, 3),
        activity: Math.round(30 * Math.log10(totalStars + 1) + Math.min(30, list.length * 2) + recency),
      }
    })
  }

  const by = (key: AuthorSortKey): AuthorStat[] =>
    [...(cached ?? [])].sort((a, b) =>
      key === 'stars' ? b.totalStars - a.totalStars || b.count - a.count
        : key === 'count' ? b.count - a.count || b.totalStars - a.totalStars
          : b.activity - a.activity || b.totalStars - a.totalStars)

  return { authors: cached ?? [], by }
}
