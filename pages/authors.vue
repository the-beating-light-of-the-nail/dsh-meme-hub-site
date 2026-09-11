<script setup lang="ts">
// /authors 作者榜：从插件数据聚合出的作者维度总榜（竞品没有的差异化页面）。
// 三种排序（综合活跃 / 总星数 / 插件数）全部预渲染在 HTML 里（v-show 切换），
// 列表渐进加载；#owner 锚点支持从插件详情页跳转定位到具体作者行。
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins } = usePlugins()
const { authors, by } = useAuthors()

// 三榜 Tab。v-show（而非 v-if）保证三份榜单都在预渲染 HTML 里，默认榜完整可见
const tab = ref<'activity' | 'stars' | 'count'>('activity')
const ranked = computed(() =>
  tab.value === 'stars' ? by('stars') : tab.value === 'count' ? by('count') : by('activity'))

// 渐进加载：作者数 2000+，全量渲染 HTML 过大；首屏 60 行，「加载更多」每步 +120
const PAGE = 60
const STEP = 120
const shown = ref(PAGE)
const visible = computed(() => ranked.value.slice(0, shown.value))
const remaining = computed(() => Math.max(0, ranked.value.length - shown.value))
watch(tab, () => { shown.value = PAGE })

const siteUrl = config.public.siteUrl as string
const pageUrl = computed(() => `${siteUrl}${localePath('/authors')}`)
const title = computed(() => t('meta.authorsTitle', { n: plugins.length }))
const desc = computed(() => t('meta.authorsDesc', { n: authors.length }))

// 默认榜（综合活跃）Top 30 进 ItemList 结构化数据，与首屏渲染同一数据源
const topRanked = by('activity').slice(0, 30)

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: desc.value },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: desc.value },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale-hero.webp` },
    { property: 'og:url', content: pageUrl.value },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: t('authors.title'),
        itemListElement: topRanked.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: a.owner,
          url: `https://github.com/${a.owner}`,
        })),
      }),
    },
  ],
}))

// #owner 锚点：来自插件详情页的作者 chip。目标行可能未在首屏 → 先扩容再滚动高亮
onMounted(() => {
  const owner = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (!owner) return
  const idx = ranked.value.findIndex(a => a.owner.toLowerCase() === owner.toLowerCase())
  if (idx < 0) return
  shown.value = Math.max(shown.value, idx + 1)
  requestAnimationFrame(() => {
    const el = document.getElementById(`author-${owner}`)
    el?.scrollIntoView({ block: 'center' })
    el?.classList.add('anchor-hit')
  })
})
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>{{ t('authors.title') }}</h1>
      <p class="sub">{{ t('authors.sub', { p: plugins.length, n: authors.length }) }}</p>
      <p class="count-note" style="margin:0">{{ t('authors.note') }}</p>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'activity' }" @click="tab = 'activity'">{{ t('authors.tabActivity') }}</button>
      <button :class="{ active: tab === 'stars' }" @click="tab = 'stars'">{{ t('authors.tabStars') }}</button>
      <button :class="{ active: tab === 'count' }" @click="tab = 'count'">{{ t('authors.tabCount') }}</button>
    </div>

    <section class="section">
      <div class="author-list">
        <div v-for="(a, i) in visible" :key="a.owner" :id="`author-${a.owner}`" class="author-row">
          <span class="rank" :class="`r${i + 1}`">{{ i + 1 }}</span>
          <img class="avatar" :src="`https://github.com/${a.owner}.png?size=64`" :alt="a.owner" width="32" height="32" loading="lazy" decoding="async">
          <a class="name" :href="`https://github.com/${a.owner}`" target="_blank" rel="noopener">{{ a.owner }} ↗</a>
          <span class="works">
            <NuxtLink
              v-for="p in a.topPlugins" :key="p.slug"
              class="chip" :to="localePath(`/plugins/${p.slug}`)"
              :title="`${p.name} · ${p.stars.toLocaleString()}★`"
            >{{ p.name }}</NuxtLink>
          </span>
          <span class="stat"><b>{{ a.count }}</b> {{ t('authors.colPlugins') }}</span>
          <span class="stat"><b>{{ a.totalStars.toLocaleString() }}</b> ★</span>
          <span class="stat score">{{ a.activity }}</span>
        </div>
      </div>
      <div class="load-more">
        <button v-if="remaining" class="btn" @click="shown += STEP">
          {{ t('authors.loadMore', { n: remaining }) }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 作者行：rank / 头像 / 名字 / 代表作 chips / 插件数 / 总星 / 活跃分 */
.author-list { display: flex; flex-direction: column; }
.author-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 8px; border-bottom: 1px solid var(--border, #eaeef2);
  scroll-margin-top: 90px;
}
.author-row.anchor-hit { outline: 2px solid #54aeff; border-radius: 8px; background: #f6fbff; }
.rank {
  flex-shrink: 0; width: 28px; text-align: center;
  font-weight: 700; color: var(--text-3, #6e7781); font-size: 14px;
}
.rank.r1 { color: #d4a72c; }
.rank.r2 { color: #818b98; }
.rank.r3 { color: #bc6c25; }
.avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #eff2f5; }
.name { font-weight: 600; color: var(--text-1, #1f2328); text-decoration: none; white-space: nowrap; }
.name:hover { color: #0969da; }
.works { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; overflow: hidden; }
.works .chip { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stat { flex-shrink: 0; font-size: 13px; color: var(--text-3, #57606a); font-variant-numeric: tabular-nums; }
.stat b { color: var(--text-1, #1f2328); font-weight: 600; }
.stat.score { width: 34px; text-align: right; font-weight: 700; color: #1a7f37; }
.load-more { text-align: center; padding: 18px 0 50px; }
@media (max-width: 720px) {
  /* 小屏：代表作 chips 换行会撑爆，只保留名字与两个核心数 */
  .works { display: none; }
  .author-row { gap: 8px; }
}
</style>
