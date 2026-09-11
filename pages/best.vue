<script setup lang="ts">
// SEO-PLACEHOLDER: 待升级（增速榜等）
// /best 榜单专题页：承接 best dsh plugins / top deepseek harness plugins / dsh 插件排行
// 这类搜索词的独立落地页（竞品的 rank 是 hash 路由对引擎隐身，本页是预渲染 URL + Schema）。
// 三榜全部由 usePlugins() 现有数据动态计算，本页不写死任何数字。
const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { plugins, byStars, byScore, scoreOf, memes, fresh, descOf, updatedAt } = usePlugins()

// 四榜 Tab。v-show（而非 v-if）保证四榜内容都在预渲染 HTML 里，默认榜完整可见
const tab = ref<'stars' | 'score' | 'recent' | 'picks'>('stars')

// 榜一：Star 总榜（默认展示）
const topStars = byStars().slice(0, 30)

// 榜二：实用分榜（compute-scores 五维评分总分倒序，并列按 stars 破序）
const topScored = byScore().slice(0, 30)

// 榜三：近期活跃。近 14 天不足 8 条则放宽到 30 天；按 stars 降序
const fresh14 = fresh(14)
const recentDays = fresh14.length >= 8 ? 14 : 30
const active = (recentDays === 14 ? fresh14 : fresh(30)).sort((a, b) => b.stars - a.stars)

// 榜四：编辑精选。整活区 star Top 12，MemeCard 的 captionOf 就是推荐点评
const picks = [...memes()].sort((a, b) => b.stars - a.stars).slice(0, 12)

const siteUrl = config.public.siteUrl as string
const pageUrl = `${siteUrl}${localePath('/best')}`
const title = computed(() => t('meta.bestTitle', { n: topStars.length }))
const desc = computed(() =>
  t('meta.bestDesc', { total: plugins.length, top: topStars.length, picks: picks.length, d: recentDays }))

useHead({
  title,
  meta: [
    { name: 'description', content: desc },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:image', content: `${siteUrl}/images/dsh-deep-whale-hero.webp` },
    { property: 'og:url', content: pageUrl },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'DSH Meme Hub', item: `${siteUrl}${localePath('/')}` },
          { '@type': 'ListItem', position: 2, name: t('nav.best'), item: pageUrl },
        ],
      }),
    },
    {
      // ItemList 与默认 Tab（Star 总榜）同一数据源，排序一致，永不漂移
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: topStars.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${siteUrl}${localePath(`/plugins/${p.slug}`)}`,
        })),
      }),
    },
  ],
})
</script>

<template>
  <!-- SEO-PLACEHOLDER: 待升级（增速榜等） -->
  <div class="container">
    <div class="page-head">
      <h1>{{ t('best.title') }}</h1>
      <p class="sub">{{ t('best.sub', { n: plugins.length }) }}</p>
      <p class="count-note" style="margin:0">{{ t('best.updatedNote', { date: updatedAt }) }}</p>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'stars' }" @click="tab = 'stars'">{{ t('best.tabStars') }}</button>
      <button :class="{ active: tab === 'score' }" @click="tab = 'score'">{{ t('best.tabScore') }}</button>
      <button :class="{ active: tab === 'recent' }" @click="tab = 'recent'">{{ t('best.tabRecent') }}</button>
      <button :class="{ active: tab === 'picks' }" @click="tab = 'picks'">{{ t('best.tabPicks') }}</button>
    </div>

    <!-- 榜一：Star 总榜（默认展示） -->
    <section v-show="tab === 'stars'" class="section">
      <div class="section-head">
        <h2>{{ t('best.starsH', { n: topStars.length }) }}</h2>
        <span class="count-note">{{ t('best.starsSub', { n: topStars.length }) }}</span>
      </div>
      <div class="top-list">
        <NuxtLink v-for="(p, i) in topStars" :key="p.slug" :to="localePath(`/plugins/${p.slug}`)" class="row">
          <span class="rank" :class="`r${i + 1}`">{{ i + 1 }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="one-liner">{{ descOf(p, locale) }}</span>
          <span class="stars">{{ p.stars.toLocaleString() }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 榜三：近期活跃 -->
    <section v-show="tab === 'recent'" class="section">
      <div class="section-head">
        <h2>{{ t('best.recentH') }}</h2>
        <span class="count-note">{{ t('best.recentSub', { n: active.length, d: recentDays }) }}</span>
      </div>
      <div class="top-list">
        <NuxtLink v-for="p in active" :key="p.slug" :to="localePath(`/plugins/${p.slug}`)" class="row">
          <span class="name">{{ p.name }}</span>
          <span class="one-liner">{{ descOf(p, locale) }}</span>
          <span class="date">{{ p.pushed_at }}</span>
          <span class="stars">{{ p.stars.toLocaleString() }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 榜二：实用分榜（五维加权几何平均，维护/文档/热度/安装/信号——星星少但好用的靠这榜冒头） -->
    <section v-show="tab === 'score'" class="section">
      <div class="section-head">
        <h2>{{ t('best.scoreH', { n: topScored.length }) }}</h2>
        <span class="count-note">{{ t('best.scoreSub') }}</span>
      </div>
      <div class="top-list">
        <NuxtLink v-for="(p, i) in topScored" :key="p.slug" :to="localePath(`/plugins/${p.slug}`)" class="row">
          <span class="rank" :class="`r${i + 1}`">{{ i + 1 }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="one-liner">{{ scoreOf(p)?.exp || descOf(p, locale) }}</span>
          <span class="stars">{{ scoreOf(p)?.t ?? '—' }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 榜四：编辑精选（caption 引用即点评，竞品没有的人味） -->
    <section v-show="tab === 'picks'" class="section">
      <div class="section-head">
        <h2>{{ t('best.picksH') }}</h2>
        <span class="count-note">{{ t('best.picksSub', { n: picks.length }) }}</span>
      </div>
      <div class="grid cols-3">
        <MemeCard v-for="p in picks" :key="p.slug" :plugin="p" :seed-likes="Math.floor(p.stars / 50)" />
      </div>
    </section>

    <section class="section" style="padding-bottom:50px">
      <div class="prose">
        <h2>{{ t('best.howH') }}</h2>
        <p>{{ t('best.howP1', { date: updatedAt, d: recentDays }) }}</p>
        <p>{{ t('best.howP2') }}</p>
        <p>
          <NuxtLink class="btn green" :to="localePath('/plugins')" style="margin-right:10px">{{ t('best.allCta', { n: plugins.length }) }}</NuxtLink>
          <NuxtLink :to="localePath('/submit')">{{ t('best.submitCta') }}</NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 榜二的推送日期列：全局 .top-list 只有 rank/name/one-liner/stars 四种列 */
.date { color: var(--text-3); font-size: 13px; white-space: nowrap; flex-shrink: 0; }
</style>
