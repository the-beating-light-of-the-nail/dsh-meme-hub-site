# dsh-skin-token-dashboard

面向 DeepSeek Harness Desktop/Web 的 TypeScript 插件工程，提供：

- 两套可切换桌面皮肤：深海夜航（暗色）与暖纸日光（亮色）。
- 五套随包发布的内置摄影背景，以及可递归读取子文件夹的本地图片轮播。
- 可展示扫描到的子文件夹，并将轮播范围限制为全部目录、仅根目录或指定子文件夹（包含其更深层目录）。
- 可设置轮播分钟间隔、暂停/继续和立即切换下一张；优先使用 Electron 兼容目录输入，通过相对路径递归遍历。
- 保留两套完整皮肤，另支持自定义 CSS 背景色、图片透明度和背景色/渐变覆盖透明度。
- “设置 → 通用”中的皮肤与背景选择器，可即时切换；皮肤、颜色、透明度、文件夹、子目录范围、当前图片和轮播参数在重启后自动恢复。
- “设置 → Token 用量”详细面板，实时展示当前会话的总量、计费输入、输出、缓存命中率及四类 Token 构成。
- 基于官方 `tokenUsage` 会话投影的 Token 汇总读取 API。
- 同时保留 Harness 原生聊天统计条；不复制消息内容，不另建统计数据库。

## 为什么复用官方 Token 统计

标准 DeepSeek Harness base profile 已装载 `@deepseek-ai/dsh-token-meter`。它从持久会话日志回放并去重，能覆盖普通请求、失败请求、分页历史和上下文压缩。插件只读取其最终投影：

- `uncachedInputTokens`：未命中缓存的输入。
- `cacheReadTokens`：缓存读取。
- `cacheWriteTokens`：缓存写入。
- `outputTokens`：输出，已经包含 reasoning token，不能重复相加。
- `billedInputTokens`：前三个输入桶之和。
- `totalTokens`：计费输入加输出。

## 安装

要求 Node.js `^22.19.0 || >=24.0.0`。把已发布版本安装到标准 Web profile：

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add dsh-skin-token-dashboard
```

安装完成后重启 Harness。使用 DSH Desktop 插件市场时，也可以搜索 `dsh-skin-token-dashboard` 并安装到 Web profile。

## 从源码开发

Windows 使用 nvm 时先安装并切换版本：

```powershell
nvm install 22.19.0
nvm use 22.19.0
node --version
```

安装依赖并验证工程：

```powershell
npm install
npm run check
```

安装到官方 DSH Desktop：

```powershell
npm run install:desktop
```

官方 DSH Desktop 会设置独立的 `DSH_HOME`，Windows 默认位于 `%APPDATA%\dsh-desktop\harness`，并以 `web` profile 加桌面补丁启动。`install:desktop` 会自动定位这个目录，不会误装到 `%USERPROFILE%\.dsh`。

若某个自定义发行版明确使用标准 DSH_HOME 下名为 `desktop` 的 profile，可执行：

```powershell
npm run install:profile-desktop
```

安装脚本按以下顺序寻找 CLI：

1. PATH 中已有的 `dsh`。
2. 本机 DSH Desktop 自带的官方 CLI。
3. 最后才通过 `npx` 下载 CLI。

安装桌面端时，脚本会优先使用 `DSH_HOME\.desktop-bin` 中由桌面端提供的 pnpm shim，避免系统 pnpm 与桌面端 store 版本不一致。标准 profile 安装才会在需要时通过 corepack 准备 pnpm。

安装成功后完全退出并重新打开 DSH Desktop，再进入“设置 → 通用 → 桌面皮肤”切换主题或 Harness 背景。插件在 Host 端注册 `skin-token-dashboard` 设置命名空间，皮肤 ID、内置背景、背景颜色、两个透明度、本地文件夹路径、轮播间隔、播放状态、子目录筛选和当前图片相对路径都会写入 `$DSH_HOME/settings.yaml`；升级后的首次启动会把已有浏览器本地设置迁移到该分节。旧版本通过浏览器临时文件输入选择的目录没有可迁移的绝对路径，升级后需重新选择一次，此后 DSH Desktop 重启会由 Host 自动恢复并重新扫描。插件递归查找所选目录及子目录中的 AVIF、BMP、GIF、JPEG、PNG 和 WebP 图片（最多 2000 张），按相对路径自然排序；可设置 1–1440 分钟的切换间隔，也可暂停或点击“下一张”立即切换。图片切换使用 900ms 交叉淡入，并遵循系统“减少动态效果”设置。背景图片透明度与背景色/渐变覆盖透明度可分别调节，并可叠加皮肤原色或自定义 CSS 背景色；也可以随时恢复纯色背景。“设置 → Token 用量”会展示当前会话的详细汇总；Harness 原生统计条仍位于聊天输入框下方。

> 不同桌面发行版可能把插件安装入口封装在图形界面中。此时选择本目录，或先 `npm pack` 后安装生成的包即可。

## Host API

插件注册 `ctx.skinTokenUsage` 服务：

```ts
const usage = ctx.skinTokenUsage.read(session)

if (usage) {
  console.log(usage.billedInputTokens)
  console.log(usage.outputTokens)
  console.log(usage.totalTokens)
  console.log(usage.cacheHitRate)
}
```

`read()` 是同步一致性读取，只返回汇总计数，不返回 prompt、response 或工具内容。

## 常用命令

```powershell
npm run typecheck               # TypeScript 静态检查
npm test                        # Vitest 单元测试
npm run build                   # 生成 Host ESM 与 Client bundle
npm run check                   # 类型检查 + 测试 + 构建
npm run install:desktop         # 安装到官方 DSH Desktop 使用的 web profile
npm run install:profile-desktop # 安装到显式命名的 desktop profile
```

## 常见安装错误

### 无法将“dsh”识别为 cmdlet

这是 CLI 没有全局安装或不在 PATH，不是插件构建失败。请执行 `npm run install:desktop`；脚本会自动寻找 DSH Desktop 内置 CLI。

### 执行后只有旋转光标

旧脚本使用 `npx` 临时解析完整 DSH 依赖树，首次运行可能长时间没有输出。新版安装脚本优先使用桌面端内置 CLI，不再走这条慢路径。

### 安装成功但桌面端看不到

确认安装输出中包含 `DSH Desktop home：...\AppData\Roaming\dsh-desktop\harness`。若显示 `.dsh\profiles`，说明装到了标准 CLI profile，请重新执行 `npm run install:desktop`。安装完成后需完全退出并重新打开 DSH Desktop。

### Unsupported engine / Node 版本不满足

执行 `node --version`。本项目与当前 Harness 要求 Node.js `^22.19.0 || >=24.0.0`；例如 `v22.4.0` 不满足要求，需要先升级。

## 文档

- [工程结构](docs/STRUCTURE.md)
- [架构与数据流](docs/ARCHITECTURE.md)
- [开发、调试与发布](docs/DEVELOPMENT.md)

## 兼容性说明

本工程按 DeepSeek Harness 0.1.x 当前公开契约实现：

- 插件模块导出 `apply(ctx)`。
- npm 清单用 `dsh.bundle.patch` 激活配置层。
- 浏览器半部由 `dsh.client` 与 `./client` 导出加载。
- 主题通过 `ctx.theme.register()` 注册，只覆盖 `--dsw-*` 语义 Token。
- Token 数据读取官方 `sessionProjections.snapshot(session).values.tokenUsage`。

如果未来 Harness 修改预发布 API，优先更新 peer dependency 范围和 `src/index.ts` 的投影适配层，皮肤定义本身通常无需修改。

## 隐私

插件不发起外部网络请求，不保存会话内容。皮肤偏好与用户明确选择的本地背景文件夹路径通过 DSH 官方 Settings API 写入本机 `$DSH_HOME/settings.yaml` 的 `skin-token-dashboard` 分节；图片内容不会复制到设置或数据库中。Host 文件读取 RPC 仅接受本机回环连接，只读取已由原生选择器授权并保存的目录，拒绝路径越界和符号链接穿透；Token 统计来自本机 Harness 已有的持久会话投影。
