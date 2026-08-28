# 鲸迹 · dsh-showreel

> 📖 [English Usage Guide →](./USAGE.md)

把最近一次 DeepSeek Harness Agent 任务变成约 30 秒的竖屏战报：可编辑预览，一键导出 1080×1920 MP4（不支持时回退 WebM）和封面 PNG。

> English summary: dsh-showreel turns the latest completed DeepSeek Harness turn into an editable, privacy-redacted vertical video. It runs locally, exports a 1080×1920 MP4/WebM plus PNG cover, and never uploads your session.

![鲸迹演示封面](https://raw.githubusercontent.com/xiaoyuer3921/dsh-showreel/6eda9593c834a5579490e776c0ae076539f023ed/assets/demo-cover.png)

🎬 [查看由插件真实导出的 30 秒 MP4 演示](./assets/demo.mp4)

## 一行安装

要求 DeepSeek Harness `0.1.0-rc.7`、Node.js `^22.19 || >=24`，使用 Web profile：

```bash
dsh plugin --profile web add dsh-showreel
```

DSH 会安装包，并根据包内的 `dsh.bundle` 声明将 `dsh-showreel` 加入目标 profile。随后运行：

```bash
dsh web
```

打开任意已有完成任务的会话，点击会话标题栏的 🎬。

本地开发时可安装当前目录：

```bash
pnpm install && pnpm build
dsh plugin --profile web add /absolute/path/to/dsh-showreel
```

## 能做什么

- 从当前会话最近一个已结束 Turn 生成五幕故事板：目标、执行、验证、成果、收尾。
- 汇总工具调用、文件数、模型、耗时和 Token；不会宣称未发生的测试“已通过”。
- 导出前可修改标题、逐幕文案和时长，也可关闭任意一幕。
- 可选调用本次任务所用模型润色；只发送已脱敏的结构化事实，失败即保留规则文案。
- Canvas 以 30 FPS 实时渲染。Chromium 优先使用 H.264/AAC MP4；不支持 MP4 时明确提示并回退 WebM。
- 同时生成 1080×1920 的首帧 PNG 封面。
- 可选 OpenAI-compatible `/audio/speech` 配音；未配置、超时、解码失败或请求失败时静音导出。

不包含自动上传、云端分享、背景音乐、横屏模板、模板市场或完整会话回放。

## 隐私边界

插件对 Session 和 workspace 全程只读。默认不会使用或展示：

- reasoning / thinking 内容；
- 完整命令输出；
- 完整 Diff；
- API Key、Bearer Token、常见访问令牌、私钥、密码字段；
- 用户目录、workspace 等绝对路径。

所有事实先在 Host 脱敏，再进入规则文案、AI 润色和配音。编辑器会显示脱敏计数与警告，导出必须由用户主动点击。浏览器请求不能传入 TTS 地址或密钥。

## 配置配音

在 Web profile 的 `cordis.patch.yml` 覆盖已经安装的 row：

```yaml
- id: dsh-showreel
  config:
    tts:
      baseUrl: https://api.openai.com/v1
      model: gpt-4o-mini-tts
      voice: alloy
      credentialRef: DSH_SHOWREEL_TTS_API_KEY
      timeoutMs: 60000
      maxAudioBytes: 10485760
```

将实际密钥交给 DSH credentials provider（例如环境变量 `DSH_SHOWREEL_TTS_API_KEY` 或本机托管凭据文件）。`credentialRef` 只是引用；密钥仅由 Host 在每次请求时解析，不进入配置、Session、浏览器或导出文件。

`baseUrl` 应为带版本的服务根地址，例如 `https://api.openai.com/v1`。插件只会在已保存配置后追加 `/audio/speech`；远程地址必须使用 HTTPS，本机 `localhost`/loopback 可以使用 HTTP。

## 本机 API

所有接口同源挂载在 `/showreel/api`，默认请求体上限 64 KiB，音频响应上限 10 MiB：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/showreel/api/sessions` | 返回可读取的会话摘要 |
| `POST` | `/showreel/api/storyboard` | 为指定 session/turn 生成故事板 |
| `POST` | `/showreel/api/polish` | 用原任务模型润色脱敏文案 |
| `POST` | `/showreel/api/narration` | 使用 Host 已保存的 TTS 配置生成音频 |

跨源浏览器请求会被拒绝，响应禁止缓存。TTS 接口忽略浏览器提交的任何 endpoint 字段。

## Public interfaces

```ts
interface ShowreelStoryboardV1 {
  version: 1
  sessionId: string
  sourceTurn: string
  title: string
  scenes: ShowreelScene[]
  stats: ShowreelStats
  privacy: { redactionCount: number; warnings: string[] }
}

interface ShowreelScene {
  id: string
  kind: "goal" | "work" | "verification" | "result" | "outro"
  durationMs: number
  headline: string
  body: string[]
  enabled: boolean
}
```

## 开发与验证

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
npm pack --dry-run
```

在 macOS + Chrome 环境可重建真实演示素材：`pnpm demo`。该命令直接调用生产使用的 Canvas/MediaRecorder 导出函数，而不是使用预制动画。

测试覆盖官方 rc.7 SessionEvent 结构、最后完成 Turn、正常/失败/无工具/取消/模型错误/压缩与千级事件、脱敏、工具分类、Token 汇总、故事板稳定性、AI/TTS 降级、API 同源与大小限制、路由热卸载、时间轴和 MP4/WebM 能力探测。

## 工作原理

Host 通过 `ctx.sessionQuery.readSession()` 读取持久事件，纯函数生成 `ShowreelStoryboardV1`；它不接入或修改 Agent Loop。Web Client 只在官方 `conversation.session.header.actions` additive slot 注册按钮。Canvas、MediaRecorder 和 Web Audio 全部在本机浏览器运行。

## 兼容性

- DeepSeek Harness：`0.1.0-rc.7` 系列
- Chromium 126+：支持 MediaRecorder MP4 容器；具体 H.264/AAC 编码仍由当前系统能力决定
- 其他浏览器：能力探测后可回退 WebM

## License

[MIT](./LICENSE)
