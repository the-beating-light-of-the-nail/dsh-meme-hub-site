# AGENTS.md — dsh-meme-hub-site 项目协作守则

给在此仓库工作的任何 agent（Claude Code / Codex / OpenCode / Hermes）看的项目级约束。

## 本机铁律：不要在本机构建

- **严禁在本机运行 `npm run generate` / `npm run build` / `nuxi build` 等任何构建命令**。
  本机内存极小（约 4G），SSG 预渲染 3 万+ 路由会直接 OOM（已发生过）。
- 构建与部署管线（2026-09-11 现状，README「部署」节为准）：
  1. `git push` 到 master；
  2. 触发 Actions「Build Site Artifact」workflow（workflow_dispatch，约 5-10 分钟；
     无 ci.yml/Vercel——旧描述已过期）；
  3. 下载 run 产物 `site-output.zip` 解压覆盖到 `.output/public/`；
  4. 本机 `npx wrangler deploy` 直传 Cloudflare（OAuth 自动续期，可挂代理）。
  API 触发可用 git credential fill 取 token（gh 未登录）。
- 本地最多做：写代码、静态检查（node --check / typecheck 小范围）、git 操作、
  解压产物与 wrangler deploy。
- 写 UI 迭代预览时用独立 HTML 文件（如 /tmp/*.html），不要为此启动 dev server。

## 依赖安装（本机）

- npm 10.9.4 有 arborist bug（`Cannot read properties of null (reading 'edgesOut')`），
  安装依赖必须加 `--no-audit --no-fund --legacy-peer-deps`。

## 网络（本机）

- 访问 GitHub（git/curl/gh api）必须走 sing-box 代理 `http://127.0.0.1:7890`：
  - shell：`export HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890`
  - git：`git -c http.proxy=http://127.0.0.1:7890 push ...`
- Node 内置 fetch **不读** HTTP_PROXY 环境变量——需要代理的抓取脚本必须用
  undici 的 ProxyAgent + setGlobalDispatcher（参考 `scripts/fetch-screenshots.mjs`），
  GitHub Actions 环境用 `GITHUB_DIRECT=1` 直连跳过代理。
- 命令行工具（gh/curl/git）读环境变量，ok。

## 数据纪律

- `public/data/plugins.json`：站点核心数据（7625 条插件 = 人工精选 ~2771 +
  dsh.market 全量镜像 4854，镜像条目 `auto_ingested: true`，2026-09-11 起）。
  改前先读结构；
  新增条目字段必须对齐现有条目（slug/name/repo/url/description_zh/en/stars/forks/
  category_zh/en/is_meme/meme_section/meme_caption_zh/en/image/install_cmd/pushed_at/
  license/language/has_manifest/topics/description_zh_TW/category_zh_TW/
  meme_caption_zh_TW/screenshots/auto_ingested）。slug 必须 URL 安全（仅
  [A-Za-z0-9._-]，禁 # / 空格中文）。
- `scripts/import-dshmarket.mjs`：从 dsh.market 公开数据补收录（`--min-stars N`
  控门槛，`--dry-run` 预览）；去重按 repo 小写（含 #path 子包剥离）。
- `public/data/scores.json`：实用五维评分（key=repo 小写 → {t,m,p,h,e,s,conf,exp}），
  **只由 `scripts/compute-scores.mjs` 生成**（每日 CI 在 refresh-stars 后自动重跑），
  禁止手改。方法论：五维加权几何平均（维护30/实用25/热度20/便捷15/信号10）+
  贝叶斯置信，详见 /docs/reference/scoring。
- `scripts/gen-zh-tw.mjs` **非幂等**：重跑会整体重写 zh-TW.json 与 plugins.json 繁体
  字段，覆盖人工润色（如 插件→外掛 等用词）。**禁止整跑**；补少量 key 用手工 patch，
  遵循 OpenCC s2twp 惯例。
- `scripts/build-data.py` 是 LEGACY，**禁止运行**（会从外部源整体重建文件丢字段）。
- 分类体系：16 类落地页由 `data/seo/category-pages.json` 驱动，
  filter.categoryZh 是精确值（工具与集成/UI 增强/Agent 与自动化/生态与开发/
  安全与运维/记忆与知识/客户端与终端/视觉与多模态/赛博宠物/抽象整活/娱乐/
  酒馆与角色扮演/换皮肤色/会话与消息/摸鱼游戏/股票金融）。
  插件 category_zh 必须精确等于其中之一。
  新增类目时同步改 `composables/usePlugins.ts` 的 CATEGORY_EMOJI 与本清单。
- 作者榜：`composables/useAuthors.ts` 按 repo 前缀聚合（无独立数据文件），
  /authors 页 + `#owner` 锚点；新增数据字段时保持 repo 可解析出 owner。

## git 提交纪律

- 提交身份用真实账号：`git -c user.name="the-beating-light-of-the-nail" -c user.email="the-beating-light-of-the-nail@users.noreply.github.com" commit ...`
- commit message 带类型前缀：`feat(收录):` / `fix(seo):` / `chore(data):` 等。
- push 前先 `git fetch origin <branch>` + rebase；禁止 force push。

## i18n 约定

- 四语同步：zh / en / de / zh-TW，key 一一对应（zh-TW 人工手写或按 s2twp 惯例）。
- Vue 模板里禁止裸 `|` 和 `@`（vue-i18n 特殊字符）——必须写成 `{'|'}` `{'@'}`。
- 对外文案不造假：数据表述与事实一致，不写"实时"除非真实时。

## 本机进程注意

- 不要同时起多个重进程（dev server + 构建 + 大脚本）——内存不够。
- 长任务用后台 + notify，别阻塞。
