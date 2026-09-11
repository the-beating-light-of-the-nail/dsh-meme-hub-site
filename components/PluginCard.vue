<script setup lang="ts">
import type { DshPlugin } from '~/composables/usePlugins'

const props = defineProps<{ plugin: DshPlugin }>()
const { locale } = useI18n()
const { catOf, descOf, emojiOf, scoreOf, scoreTierOf } = usePlugins()
const localePath = useLocalePath()

/** 缩略图回退：无本地精修封面时用仓库截图首图（无已知宽高，比例交给 CSS） */
const fallbackShot = computed(() =>
  props.plugin.image ? null : (props.plugin.screenshots?.[0]?.url ?? null))
/** 截图首图加载失败（commit 被删/图床失效）→ 整个缩略图块消失，不留破图 */
const shotFailed = ref(false)

/** 实用分徽章（compute-scores 管道缺数据时整枚不渲染） */
const score = computed(() => scoreOf(props.plugin))
const tier = computed(() => (score.value ? scoreTierOf(score.value) : ''))
</script>

<template>
  <article class="plugin-card">
    <div class="title-row">
      <h3><NuxtLink :to="localePath(`/plugins/${plugin.slug}`)">{{ plugin.name }}</NuxtLink></h3>
      <span class="chip">{{ emojiOf(plugin) }} {{ catOf(plugin, locale) }}</span>
      <span v-if="plugin.is_meme" class="chip orange">🔥 meme</span>
    </div>
    <div v-if="plugin.image" class="card-thumb">
      <img
        :src="plugin.image" :alt="plugin.name"
        :width="plugin.image_w" :height="plugin.image_h"
        loading="lazy" decoding="async"
      >
    </div>
    <div v-else-if="fallbackShot && !shotFailed" class="card-thumb card-thumb--auto">
      <img
        :src="fallbackShot" :alt="plugin.name"
        loading="lazy" decoding="async"
        @error="shotFailed = true"
      >
    </div>
    <p class="desc">{{ descOf(plugin, locale) }}</p>
    <div class="meta-row">
      <span class="stars">{{ plugin.stars.toLocaleString() }}</span>
      <span v-if="score" class="score-chip" :class="`t-${tier}`" :title="score.exp">
        {{ score.t }}{{ locale === 'zh' || locale === 'zh-TW' ? ' 分' : '' }}
      </span>
      <span v-if="plugin.pushed_at">{{ plugin.pushed_at }}</span>
      <span v-if="plugin.has_manifest" class="chip green">✓ manifest</span>
    </div>
    <AppCopyCmd :cmd="plugin.install_cmd" />
  </article>
</template>

<style scoped>
/* 截图首图回退：无已知宽高，容器定 16/10 比例配合全局 .card-thumb img 的 cover 裁切防拉伸 */
.card-thumb--auto { aspect-ratio: 16 / 10; }

/* 实用分徽章：分档配色（90+ 绿 / 70+ 蓝 / 50+ 中性 / 其余淡化），title 悬浮展示评分理由 */
.score-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  cursor: help;
}
.score-chip.t-elite { color: #1a7f37; background: #dafbe1; }
.score-chip.t-great { color: #0969da; background: #ddf4ff; }
.score-chip.t-good { color: #57606a; background: #f0f2f5; }
.score-chip.t-watch { color: #6e7781; background: #f6f8fa; opacity: 0.75; }
</style>
