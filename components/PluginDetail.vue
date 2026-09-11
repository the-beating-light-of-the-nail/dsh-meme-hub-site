<script setup lang="ts">
// 插件/整活详情页主体（双轨合一）。variant='plugin'（默认）保持原 plugins/[slug]
// 行为不变；variant='meme' 由 pages/meme/[slug].vue 薄壳传入，叠加梗图注/点赞/
// 同分区推荐/CreativeWork schema 等 meme 身份元素。共享区块（画廊/安装命令/
// 双语描述/证据卡/editorial/README）只留一份实现。
import type { DshPlugin } from '~/composables/usePlugins'

const props = withDefaults(defineProps<{ plugin: DshPlugin, variant?: 'plugin' | 'meme' }>(), { variant: 'plugin' })
// 分发器已保证 plugin 存在且页面级恒定（一页一插件），无需响应式解包；variant 同理
const plugin = props.plugin
const isMeme = props.variant === 'meme'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { related, catOf, emojiOf, descOf, captionOf, memes, scoreOf, scoreTierOf } = usePlugins()

const siteUrl = config.public.siteUrl as string
const desc = computed(() => descOf(plugin, locale.value))

// 实用五维评分（compute-scores 管道缺数据时整卡不渲染）
const score = scoreOf(plugin)
const tier = score ? scoreTierOf(score) : ''
const scoreDims = score
  ? [{ key: 'm', v: score.m }, { key: 'p', v: score.p }, { key: 'h', v: score.h }, { key: 'e', v: score.e }, { key: 's', v: score.s }]
  : []
const caption = computed(() => captionOf(plugin, locale.value))
const pageUrl = computed(() =>
  `${siteUrl}${localePath(isMeme ? `/meme/${plugin.slug}` : `/plugins/${plugin.slug}`)}`)
const ogImage = computed(() => `${siteUrl}${plugin.image ?? '/images/dsh-deep-whale.webp'}`)

const title = computed(() => isMeme
  ? t('meta.memeDetailTitle', { name: plugin.name, caption: caption.value })
  : t('meta.pluginDetailTitle', { name: plugin.name, category: catOf(plugin, locale.value) }))
// meme 轨描述带梗图注前缀（原 meme 页行为）；og:description 用 caption
const metaDescription = computed(() => isMeme ? `${caption.value} — ${desc.value}` : desc.value)
const ogDescription = computed(() => isMeme ? caption.value : desc.value)

// schema 双身份：plugins 轨 SoftwareApplication / meme 轨 CreativeWork(genre:'meme')，
// 避免双轨同类型被判重复内容
const jsonLd = computed(() => {
  if (isMeme) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: plugin.name,
      description: caption.value,
      url: pageUrl.value,
      inLanguage: locale.value,
      genre: 'meme',
      about: plugin.name,
      author: { '@type': 'Person', name: plugin.repo.split('/')[0] },
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: plugin.name,
    description: desc.value,
    url: pageUrl.value,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    softwareVersion: 'community',
    author: { '@type': 'Person', name: plugin.repo.split('/')[0] },
    codeRepository: plugin.url,
    installUrl: plugin.url,
    ...(plugin.license ? { license: `https://spdx.org/licenses/${plugin.license}.html` } : {}),
    aggregateRating: plugin.stars > 0
      ? {
          '@type': 'AggregateRating',
          // 有实用分走五维总分（0-100 → 0-5），与页面评分卡一致；无分回退 star 对数公式
          ratingValue: score
            ? Number((score.t / 20).toFixed(1))
            : Number(Math.min(5, 3.5 + Math.log10(plugin.stars + 1) / 2).toFixed(1)),
          bestRating: '5',
          ratingCount: plugin.stars,
        }
      : undefined,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
})

useHead(() => ({
  title: title.value,
  meta: [
    { name: 'description', content: metaDescription.value },
    { property: 'og:title', content: plugin.name },
    { property: 'og:description', content: ogDescription.value },
    { property: 'og:image', content: ogImage.value },
    { property: 'og:url', content: pageUrl.value },
    // 原 meme 页无 og:type，仅在 plugin 轨输出（保持两轨 head 均与迁移前一致）
    ...(isMeme ? [] : [{ property: 'og:type', content: 'website' }]),
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify(jsonLd.value),
  }],
}))

const rel = computed(() => related(plugin, 4))
/** meme 轨：同分区推荐 ×3（按 star 倒序），plugin 轨恒空不渲染 */
const relMemes = computed(() => !isMeme
  ? []
  : memes().filter(x => x.slug !== plugin.slug && x.meme_section === plugin.meme_section)
      .sort((a, b) => b.stars - a.stars).slice(0, 3))

// 本地点赞（仅 meme 轨渲染按钮；load 读 localStorage 必须等客户端挂载）
const likes = useLikes()
onMounted(() => likes.load())

// 「本站点评」人工字段:数据源尚未注入(editorial_zh/editorial_en 均可选),类型上
// 局部扩展而非改 DshPlugin;zh 系(含 zh-TW,同 descOf 惯例)取中文、缺省兜底英文
type EditorialPlugin = DshPlugin & { editorial_zh?: string; editorial_en?: string }
const editorial = computed(() => {
  const p = plugin as EditorialPlugin
  if (locale.value === 'zh' || locale.value === 'zh-TW') return p.editorial_zh || p.editorial_en || ''
  return p.editorial_en || ''
})

// 社区发布页(人工字段;平台名为品牌词按语言取字面,未登记平台回退域名,无数据整组不渲染)
const COMMUNITY_PLATFORMS: Record<string, { emoji: string, zh: string, en: string }> = {
  xiaohongshu: { emoji: '📕', zh: '小红书笔记', en: 'Xiaohongshu note' },
  bilibili: { emoji: '📺', zh: 'B站视频', en: 'Bilibili video' },
  tieba: { emoji: '💬', zh: '贴吧帖子', en: 'Tieba thread' },
  zhihu: { emoji: '🧠', zh: '知乎文章', en: 'Zhihu article' },
}
const communityLinks = computed(() => (plugin.community_links ?? []).map((link) => {
  const meta = COMMUNITY_PLATFORMS[link.platform]
  const isZh = locale.value === 'zh' || locale.value === 'zh-TW'
  let label = link.platform
  if (meta) label = isZh ? meta.zh : meta.en
  else { try { label = new URL(link.url).hostname } catch { /* 数据自带平台名兜底 */ } }
  return { url: link.url, emoji: meta?.emoji ?? '🔗', label }
}))
</script>

<template>
  <div class="container">
    <div class="detail-head">
      <div class="breadcrumb">
        <template v-if="isMeme">
          <NuxtLink :to="localePath('/meme')">🤪 {{ t('meme.title') }}</NuxtLink>
          / {{ t(`meme.sections.${plugin.meme_section}`) }}
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/plugins')">{{ t('nav.plugins') }}</NuxtLink>
          / {{ catOf(plugin, locale) }}
        </template>
      </div>
      <h1>{{ plugin.name }}</h1>
      <p v-if="isMeme" class="lead" style="font-style:italic">「{{ caption }}」</p>
      <p class="lead">{{ desc }}</p>
      <div class="filter-bar" style="margin-bottom:0">
        <span class="stars" style="font-size:15px">{{ plugin.stars.toLocaleString() }} {{ t('plugin.stars') }}</span>
        <span v-if="!isMeme" class="chip">{{ emojiOf(plugin) }} {{ catOf(plugin, locale) }}</span>
        <span v-if="isMeme || plugin.is_meme" class="chip orange">🔥 meme</span>
        <a class="btn" :href="plugin.url" target="_blank" rel="noopener">{{ t('plugin.viewOnGithub') }} ↗</a>
        <a v-if="plugin.video_url" class="btn" :href="plugin.video_url" target="_blank" rel="noopener">📺 {{ t('plugin.watchDemo') }} ↗</a>
        <a
          v-for="link in communityLinks" :key="link.url" class="btn"
          :href="link.url" target="_blank" rel="noopener"
        >{{ link.emoji }} {{ link.label }} ↗</a>
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-main">
        <PluginGallery
          :image="plugin.image"
          :image-w="plugin.image_w"
          :image-h="plugin.image_h"
          :screenshots="plugin.screenshots"
          :name="plugin.name"
        />

        <div class="prose">
          <div class="lang-label">{{ t('plugin.descEn') }}</div>
          <p>{{ plugin.description_en }}</p>
          <div class="lang-label" style="margin-top:18px">{{ t('plugin.descZh') }}</div>
          <p>{{ plugin.description_zh }}</p>
        </div>

        <!-- 本站点评(人工撰写;editorial_zh/en 均未注入时整块不出现) -->
        <section v-if="editorial" class="section">
          <div class="section-head"><h2>{{ t('plugin.editorialTitle') }}</h2></div>
          <div class="editorial-box">{{ editorial }}</div>
        </section>

        <!-- 仓库 README 全文(fetch-readmes.mjs 管道产物,无文件时组件自身不渲染) -->
        <PluginReadme :slug="plugin.slug" />

        <section v-if="rel.length && !isMeme" class="section">
          <div class="section-head"><h2>{{ t('plugin.related') }}</h2></div>
          <div class="grid cols-2">
            <PluginCard v-for="p in rel" :key="p.slug" :plugin="p" />
          </div>
        </section>

        <!-- meme 轨：同分区推荐(MemeCard,种子赞 = stars/50) -->
        <section v-if="relMemes.length" class="section">
          <div class="section-head"><h2>{{ t(`meme.sections.${plugin.meme_section}`) }}</h2></div>
          <div class="grid cols-3">
            <MemeCard
              v-for="p in relMemes" :key="p.slug" :plugin="p"
              :seed-likes="Math.floor(p.stars / 50)"
            />
          </div>
        </section>
      </div>

      <aside>
        <div class="side-card">
          <h3>{{ t('plugin.install') }}</h3>
          <AppCopyCmd :cmd="plugin.install_cmd" />
          <!-- meme 轨：本地点赞(localStorage 计数,种子底数 = stars/50) -->
          <div v-if="isMeme" style="margin-top:14px;display:flex;gap:10px">
            <button
              class="btn" :class="{ liked: likes.liked(plugin.slug) }"
              @click="likes.toggle(plugin.slug)"
            >
              {{ likes.liked(plugin.slug) ? '💚' : '🤍' }} {{ likes.liked(plugin.slug) ? t('meme.liked') : t('meme.like') }} {{ likes.countOf(plugin.slug, Math.floor(plugin.stars / 50)) }}
            </button>
          </div>
        </div>

        <div class="side-card">
          <h3>{{ t('plugin.evidence') }}</h3>
          <div class="evidence-row">
            <span class="k">manifest</span>
            <span class="v" :class="plugin.has_manifest ? 'ok' : 'no'">
              {{ plugin.has_manifest ? '✓ ' + t('plugin.manifestYes') : t('plugin.manifestNo') }}
            </span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.pushed') }}</span>
            <span class="v">{{ plugin.pushed_at || '—' }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.stars') }}</span>
            <span class="v">★ {{ plugin.stars.toLocaleString() }}</span>
          </div>
          <div v-if="plugin.forks" class="evidence-row">
            <span class="k">{{ t('plugin.forks') }}</span>
            <span class="v">{{ plugin.forks.toLocaleString() }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.license') }}</span>
            <span class="v">{{ plugin.license || '—' }}</span>
          </div>
          <div class="evidence-row">
            <span class="k">{{ t('plugin.language') }}</span>
            <span class="v">{{ plugin.language || '—' }}</span>
          </div>
        </div>

        <!-- 实用五维评分（compute-scores 每日管道；无分不渲染） -->
        <div v-if="score" class="side-card">
          <h3>{{ t('score.title') }}</h3>
          <div class="score-head">
            <span class="score-num" :class="`t-${tier}`">{{ score.t }}</span>
            <span class="score-den">/100</span>
            <span class="chip" :class="{ 'score-tier': true, [`tier-${tier}`]: true }">{{ t(`score.tier_${tier}`) }}</span>
          </div>
          <div class="score-dim">
            <span class="k">{{ t('score.dim_m') }}</span>
            <span class="bar"><span class="fill" :style="{ width: `${score.m}%` }" /></span>
            <span class="v">{{ score.m }}</span>
          </div>
          <div class="score-dim">
            <span class="k">{{ t('score.dim_p') }}</span>
            <span class="bar"><span class="fill" :style="{ width: `${score.p}%` }" /></span>
            <span class="v">{{ score.p }}</span>
          </div>
          <div class="score-dim">
            <span class="k">{{ t('score.dim_h') }}</span>
            <span class="bar"><span class="fill" :style="{ width: `${score.h}%` }" /></span>
            <span class="v">{{ score.h }}</span>
          </div>
          <div class="score-dim">
            <span class="k">{{ t('score.dim_e') }}</span>
            <span class="bar"><span class="fill" :style="{ width: `${score.e}%` }" /></span>
            <span class="v">{{ score.e }}</span>
          </div>
          <div class="score-dim">
            <span class="k">{{ t('score.dim_s') }}</span>
            <span class="bar"><span class="fill" :style="{ width: `${score.s}%` }" /></span>
            <span class="v">{{ score.s }}</span>
          </div>
          <p class="score-exp">{{ score.exp }}</p>
          <NuxtLink class="btn" :to="localePath('/docs/reference/scoring')">{{ t('score.how') }} →</NuxtLink>
        </div>

        <div v-if="plugin.topics.length" class="side-card">
          <h3>{{ t('plugin.topics') }}</h3>
          <span v-for="topic in plugin.topics" :key="topic" class="chip" style="margin:0 6px 6px 0">{{ topic }}</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 实用五维评分卡：总分大字 + 分档 chip + 五维横条（宽度 SSR 内联，无布局抖动） */
.score-head { display: flex; align-items: baseline; gap: 6px; margin-bottom: 10px; }
.score-num { font-size: 30px; font-weight: 700; line-height: 1; }
.score-num.t-elite { color: #1a7f37; }
.score-num.t-great { color: #0969da; }
.score-num.t-good { color: #57606a; }
.score-num.t-watch { color: #6e7781; }
.score-den { color: var(--text-3, #6e7781); font-size: 13px; }
.score-tier.tier-elite { color: #1a7f37; background: #dafbe1; }
.score-tier.tier-great { color: #0969da; background: #ddf4ff; }
.score-tier.tier-good { color: #57606a; background: #f0f2f5; }
.score-tier.tier-watch { color: #6e7781; background: #f6f8fa; }
.score-dim { display: grid; grid-template-columns: 64px 1fr 26px; gap: 8px; align-items: center; margin: 6px 0; font-size: 12px; }
.score-dim .k { color: var(--text-3, #57606a); }
.score-dim .v { text-align: right; font-variant-numeric: tabular-nums; color: var(--text-2, #333); }
.score-dim .bar { height: 6px; border-radius: 3px; background: #eff2f5; overflow: hidden; }
.score-dim .fill { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #54aeff, #1a7f37); }
.score-exp { font-size: 12.5px; color: var(--text-2, #424a53); margin: 10px 0; line-height: 1.6; }
</style>
