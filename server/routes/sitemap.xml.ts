import { defineEventHandler } from 'h3'
import pluginsData from '~/public/data/plugins.json'
import categoryCfgRaw from '~/data/seo/category-pages.json'
import docsData from '~/data/docs/docs-data.json'

interface Slug { slug: string; is_meme: boolean }
interface CategoryCfg { slug: string; enabled: boolean }

// 全量 sitemap：顶层页 + 分类落地页 + 全部插件详情 + 整活详情，× 4 语种（en 根路径，其余前缀）
// 分类落地页列表与 nuxt.config.ts 预渲染种子同源：data/seo/category-pages.json（enabled 的才注册）
// hreflang 用 i18n.locales 的 language 值，与 useLocaleHead 生成的页面级 alternate 保持一致
// siteUrl 来自 runtimeConfig（构建时 NUXT_PUBLIC_SITE_URL 注入），域名迁移只改一处
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = (config.public.siteUrl as string).replace(/\/$/, '')
  const plugins = (pluginsData as { plugins: Slug[] }).plugins
  const categoryPages = (categoryCfgRaw as { categories: CategoryCfg[] }).categories
    .filter(c => c.enabled)
    .map(c => `plugins/${c.slug}`)

  const top = ['', 'plugins', 'store', ...categoryPages, 'best', 'authors', 'compare', 'compare/deepseek-harness-vs-claude-code', 'compare/deepseek-harness-vs-opencode', 'compare/deepseek-harness-vs-codex', 'meme', 'submit', 'about', 'install', 'launcher']
  const urls: string[] = []

  const LANGS = [
    { code: 'en', hreflang: 'en-US', prefix: '' },
    { code: 'zh', hreflang: 'zh-CN', prefix: '/zh' },
    { code: 'zh-TW', hreflang: 'zh-Hant', prefix: '/zh-TW' },
    { code: 'de', hreflang: 'de-DE', prefix: '/de' },
  ]

  /** path: 无前缀路由（'' | 'plugins' | 'plugins/xxx'…），为每语种发 alternate */
  const emit = (path: string) => {
    const links = LANGS.map(l =>
      `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${site}${l.prefix}${path ? `/${path}` : ''}"/>`,
    )
    urls.push(
      `  <url>\n    <loc>${site}${path ? `/${path}` : '/'}</loc>\n`
      + links.join('\n')
      + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${path ? `/${path}` : '/'}"/>\n  </url>`,
    )
  }

  for (const p of top) emit(p)
  for (const plug of plugins) {
    emit(`plugins/${plug.slug}`)
    if (plug.is_meme) emit(`meme/${plug.slug}`)
  }

  // 文档区（批1）：总览 + 66 篇文档页，同一 emit() 模式输出四语 hreflang alternates
  const docPages = (docsData as { pages: Array<{ slug: string }> }).pages
  emit('docs')
  for (const d of docPages) emit(`docs/${d.slug}`)

  event.node.res.setHeader('content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`
    + `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    + urls.join('\n')
    + `\n</urlset>\n`
})
