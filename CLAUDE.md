# CLAUDE.md — dsh-meme-hub-site 项目协作守则

给在此仓库工作的任何 agent（Claude Code / Codex / OpenCode / Hermes）看的项目级约束。

## 本机铁律：不要在本机构建

- **严禁在本机运行 `npm run generate` / `npm run build` / `nuxi build` 等任何构建命令**。
  本机内存极小（约 4G），SSG 预渲染 7000+ 路由会直接 OOM（已发生过）。
- 构建与验收一律交给 CI：`git push` → GitHub Actions（ci.yml）→ Vercel 部署。
- 本地最多做：写代码、静态检查（node --check / typecheck 小范围）、git 操作。
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

- `public/data/plugins.json`：站点核心数据（1862 条插件）。改前先读结构；
  新增条目字段必须对齐现有条目（slug/name/repo/url/description_zh/en/stars/forks/
  category_zh/en/is_meme/meme_section/meme_caption_zh/en/image/install_cmd/pushed_at/
  license/language/has_manifest/topics/description_zh_TW/category_zh_TW/
  meme_caption_zh_TW/screenshots/auto_ingested）。slug 必须 URL 安全（仅
  [A-Za-z0-9._-]，禁 # / 空格中文）。
- `scripts/gen-zh-tw.mjs` **非幂等**：重跑会整体重写 zh-TW.json 与 plugins.json 繁体
  字段，覆盖人工润色（如 插件→外掛 等用词）。**禁止整跑**；补少量 key 用手工 patch，
  遵循 OpenCC s2twp 惯例。
- `scripts/build-data.py` 是 LEGACY，**禁止运行**（会从外部源整体重建文件丢字段）。
- 分类体系：14 类落地页由 `data/seo/category-pages.json` 驱动，
  filter.categoryZh 是精确值（工具与集成/UI 增强/Agent 与自动化/生态与开发/
  安全与运维/记忆与知识/客户端与终端/视觉与多模态/赛博宠物/抽象整活/娱乐/
  换皮肤色/会话与消息/摸鱼游戏）。插件 category_zh 必须精确等于其中之一。

## git 提交纪律

- 提交身份用 `alexanderdcervantes-7716 <alexanderdcervantes@gmail.com>`（本仓 local 配置已设好，直接 `git commit` 即可，不要临时 -c 覆盖）。
- commit message 带类型前缀：`feat(收录):` / `fix(seo):` / `chore(data):` 等。
- push 前先 `git fetch origin <branch>` + rebase；禁止 force push。

## i18n 约定

- 四语同步：zh / en / de / zh-TW，key 一一对应（zh-TW 人工手写或按 s2twp 惯例）。
- Vue 模板里禁止裸 `|` 和 `@`（vue-i18n 特殊字符）——必须写成 `{'|'}` `{'@'}`。
- 对外文案不造假：数据表述与事实一致，不写"实时"除非真实时。

## 本机进程注意

- 不要同时起多个重进程（dev server + 构建 + 大脚本）——内存不够。
- 长任务用后台 + notify，别阻塞。
