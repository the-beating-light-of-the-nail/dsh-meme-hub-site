# 🐋 DSH Meme Hub

**DeepSeek Harness (dsh) 社区插件策展导航** — *They list everything. We pick the good stuff — and the fun stuff.*

- Nuxt 3 全量 SSG（`nuxi generate`），双语（en 根路径 / zh 前缀），构建在 GitHub Actions（`build-site-artifact.yml`），Cloudflare Workers 静态资源直传部署
- 数据：`public/data/plugins.json`（87 插件，含 29 整活精选），由 `scripts/build-data.py` 合并两个现有数据源并用 GitHub API 富化（stars / pushed_at / license / topics / manifest 存在性）
- 域名：`dsh-meme-hub.cdqyfdbymn.me`（canonical/og/sitemap/robots 全部读 `runtimeConfig.public.siteUrl`，迁移只改 `NUXT_PUBLIC_SITE_URL` 一处）

## ⚠️ 本机铁律

开发机可用内存 ~1.6GB：**禁止本机跑 `npm run build` / `generate` / `dev` / `preview`**。SSG 构建一律交给 GitHub Actions（`build-site-artifact.yml`，按需 workflow_dispatch）。

## 数据维护

```bash
# 刷新数据（需要 gh 已登录；~2 次 API 调用/插件）
npm run build:data
```

新增插件：跑 `build:data` 后在 `scripts/build-data.py` 的 `MEME` 列表补整活条目（含双语文案与截图）。

## 部署（CI 构建 + 本机 wrangler 直传）

Cloudflare Workers 静态资源模式（`wrangler.jsonc`：`.output/public/` + custom domain）。无 Vercel、无 CI 内部署（Cloudflare 侧没有长期 API Token，本机 wrangler 是 OAuth 登录）：

1. GitHub 仓库 → Actions → **Build Site Artifact** → Run workflow（构建约 10 分钟）。
2. 下载产物（run 页下载 `site-output.zip`，或 `gh run download -n site-output -D .output/public-tmp`），解压覆盖到 `.output/public/`。
3. 本机 `npx wrangler deploy`（wrangler OAuth 会自动续期；网络不通时挂 sing-box 代理）。
4. 可选：`node scripts/indexnow.mjs` 抓取线上 sitemap 全量提交 IndexNow（key 已内置于脚本默认值，`INDEXNOW_KEY` 仅换 key 时覆盖）。
