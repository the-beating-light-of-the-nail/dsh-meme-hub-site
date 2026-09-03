import { readFileSync } from 'node:fs'

// DSH Meme Hub — Nuxt 3 SSG
// 站点域名绝不硬编码在页面里：canonical / og:url / sitemap 一律读
// runtimeConfig.public.siteUrl（默认正式域名；过渡期通过 NUXT_PUBLIC_SITE_URL
// 覆盖为 Vercel 子域名，迁移时只改一处——CI 的 env 或这里的默认值）。

// 预渲染种子：全部页面 × 2 语种，显式列出，不依赖 crawlLinks
const PLUGINS = (JSON.parse(readFileSync('./public/data/plugins.json', 'utf8')) as {
  plugins: Array<{ slug: string; is_meme: boolean }>
}).plugins
const PLUGIN_SLUGS = PLUGINS.map((p) => p.slug)
const MEME_SLUGS = PLUGINS.filter((p) => p.is_meme).map((p) => p.slug)

// 分类落地页路由：data/seo/category-pages.json 单一数据源（含存量 pets/skins/clients/ops/vision）。
// 新增/下线分类只改该 JSON，此处与 sitemap、check-prerender 自动跟随。
const CATEGORY_PAGES = (JSON.parse(readFileSync('./data/seo/category-pages.json', 'utf8')) as {
  categories: Array<{ slug: string; enabled: boolean }>
}).categories
  .filter((c) => c.enabled)
  .map((c) => `plugins/${c.slug}`)

const TOP_PAGES = ['', 'plugins', 'store', ...CATEGORY_PAGES, 'best', 'compare', 'compare/deepseek-harness-vs-claude-code', 'compare/deepseek-harness-vs-opencode', 'compare/deepseek-harness-vs-codex', 'meme', 'submit', 'about', 'install', 'launcher']
// 与 scripts/check-prerender.mjs 的 locales 保持同步
const LOCALES = ['en', 'zh', 'zh-TW', 'de']

// 文档区（批1）：/docs 总览 + 66 篇 catch-all 文档页（[...slug].vue，slug 含斜杠）。
// 数据源与 composables/useDocs.ts、server/routes/sitemap.xml.ts 同一 JSON，单一来源。
const DOC_SLUGS = (JSON.parse(readFileSync('./data/docs/docs-data.json', 'utf8')) as {
  pages: Array<{ slug: string }>
}).pages.map((p) => p.slug)
const DOCS_PAGES = ['/docs', ...DOC_SLUGS.map(s => `/docs/${s}`)]

const prerenderSeed = LOCALES.flatMap((lang) => {
  const prefix = lang === 'en' ? '' : `/${lang}`
  return [
    ...TOP_PAGES.map((p) => (p === '' ? prefix || '/' : `${prefix}/${p}`)),
    ...PLUGIN_SLUGS.map((s) => `${prefix}/plugins/${s}`),
    ...MEME_SLUGS.map((s) => `${prefix}/meme/${s}`),
    ...DOCS_PAGES.map(p => `${prefix}${p}`),
  ]
})

// DSH Dojo（雪藏教程区）：只有中文一套、不走 i18n 前缀（页面里 defineI18nRoute(false)
// 关掉了本地化路由），所以单独列出，绝不并入 TOP_PAGES——那会被 LOCALES flatMap 出 /zh/dojo。
// 与 scripts/check-prerender.mjs 的 expected 追加项保持同步。
const DOJO_PAGES = ['dojo', 'dojo/step-01', 'dojo/step-02', 'dojo/step-03', 'dojo/step-04', 'dojo/step-05', 'dojo/step-06', 'dojo/step-07', 'dojo/step-08', 'dojo/step-09', 'dojo/step-10', 'dojo/catalog', 'dojo/playground'].map((p) => `/${p}`)

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: true,
  modules: ['@nuxtjs/i18n'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // 正式域名；过渡期在 CI 用 NUXT_PUBLIC_SITE_URL 覆盖
      siteUrl: 'https://dsh-meme-hub.cdqyfdbymn.me',
      siteName: 'DSH Meme Hub',
      githubRepo: 'the-beating-light-of-the-nail/dsh-meme-hub-site',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#f6f8fa' },
      ],
      link: [
        { rel: 'icon', type: 'image/gif', href: '/images/dsh-ui-whale.gif' },
      ],
      script: [
        {
          async: true,
          src: 'https://www.googletagmanager.com/gtag/js?id=G-TXHJ840HJ3',
        },
        {
          type: 'text/javascript',
          innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-TXHJ840HJ3');`,
        },
        {
          type: 'text/javascript',
          innerHTML: `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "y2q9flakc0");`,
        },
      ],
    },
  },

  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://dsh-meme-hub.cdqyfdbymn.me',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '简体中文', file: 'zh.json' },
      // zh-TW：繁體中文（台/港/澳），UI 与数据由 scripts/gen-zh-tw.mjs 从 zh 自动转换
      { code: 'zh-TW', language: 'zh-Hant', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'dshmeme_i18n',
      redirectOn: 'root',
    },
  },

  // dev 下允许通过 Cloudflare Tunnel 域名访问本地 Vite/Nuxt dev server
  vite: {
    server: {
      allowedHosts: ['.cdqyfdbymn.me'],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [...prerenderSeed, ...DOJO_PAGES, '/sitemap.xml', '/robots.txt'],
    },
  },

  experimental: {
    payloadExtraction: false,
  },
})
