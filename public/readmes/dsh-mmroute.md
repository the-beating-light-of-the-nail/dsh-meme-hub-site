# dsh-mmroute — 多模态路由（全程交叉版）

[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin) [![CI](https://img.shields.io/badge/CI-smoke%20suites-green)](.github/workflows/ci.yml)

**English summary** — Multimodal router for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Text-only models (e.g. DeepSeek, GLM) can still handle visual tasks: every image in **every step of the agent stream** — user uploads, `read_image` results, MCP tool renders (Figma screenshots, …) — is transcribed into detailed text (verbatim OCR, chart data, visual detail) by a multimodal understander model before the request is dispatched, cached per attachment. Unmarked models are auto-classified by their adapter-declared modalities (overridable per model); image-related request failures self-recover by rerouting through the understander and retrying. Settings page: mark models multimodal/text-only, pick the understander, watch transcription/recovery stats. Works with PNG / JPEG / WebP / GIF.

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）里的每一条模型路由做**图片模态调度**，并且**贯穿整个 agent 流程**：

- **多模态模型 / 声明图片输入的模型** —— 图片原样直发；
- **纯文本模型**（显式标记，或「自动纯文本路由」判定）—— 每次请求里的每张图片，先由指定的**多模态理解模型**转述为详细文字（含图中文字逐字转录、图表数据转录、视觉细节），再连同对话一起交给纯文本模型作答；
- **报错自愈** —— 纯文本模型（或网关实际拒图的"多模态"模型）一旦出现图片类失败，自动把该路由转入转述路径并让 agent loop 重试：**两类模型在整条流程里交叉接手**，而不是"第一次读完图就不再管"。

这样，DeepSeek、GLM 等纯文本模型也能处理看图问答、截图分析、Figma 渲染审查等视觉任务。

> Multimodal router for DeepSeek Harness: text-only models get every image in every step transcribed to detailed text by a multimodal understander before the request is dispatched; image-related request failures auto-recover by rerouting through the understander and retrying. Works with image attachments (PNG / JPEG / WebP / GIF).

## 工作原理

```
agent loop 的每一次模型调用（每个 step：用户首图、read_image 返回、
MCP 工具（如 Figma get_screenshot）中途产生的新渲染图……）
   │
   ├─ ① 准入放宽：resolveModelInfo 遮蔽让「会被转述」的模型通过
   │     harness 的图片准入检查（用户上传 / read_image / MCP 图片 alike）
   │
   ├─ ② llm/stream 拦截：按 attachmentId 收集本次请求的全部图片
   │     （含 tool-result 嵌套形态），逐张交给理解模型做**全量结构化
   │     转述**（≤12000 字符：图型判定 / 全部文字逐字转录 / 图表数据
   │     / 布局 / 颜色 / 异常 / 不确定区域；内容寻址缓存，跨步骤 / 跨
   │     重启有效；当前问题作为侧重参考注入，但完整性优先、绝不省略）
   │
   └─ ③ 改写后的纯文本请求交给原模型作答 —— 对话完全无感
         转述末尾附 [提示] 行：作答模型可调用 vision_relook 工具对
         任意已转述图片发起聚焦复看（「指挥与执行」协作）

任何一步漏网（未标记、网关拒图……）导致适配器报图片类错误时：
   └─ ④ agent/request-error 自愈：拉理解模型转述 → retry
        （每条路由每进程最多自愈 2 次，杜绝重试风暴）
```

- **自动纯文本路由**（默认开启）：未标记的模型按适配器原生声明判定 —— 声明图片 → 直发；声明纯文本或未声明 → 自动按纯文本处理（先转述再作答）。关闭后未标记模型完全保持 harness 原生行为。
- 显式标记优先于自动判定：「多模态」标记的模型请求（含图片）原样直发，适合适配器未声明图片能力、但网关实际支持的模型；「纯文本」标记的模型总是先转述。
- **单一理解模型，用户手选**：理解模型即你 dsh 配置里的多模态模型（自动发现或手动指定），不内置免费端点、不借用任何外部登录态；并发转述同一张图自动合并为一次调用。
- **vision_relook 定点复看**：作答的文本模型可对任意已转述图片发起聚焦核查（`attachmentId + 聚焦问题 + 可选区域`），由理解模型逐字精确作答、看不清就明说 —— 两个用户手选的模型形成「指挥与执行」协作。
- **准确性 + 完整性铁律**（设计原则）：给纯文本模型的数据必须准确且完整 —— 逐字转录不翻译、全量覆盖不因侧重省略、宁声明「不确定区域」绝不猜测；单条转述上限 12000 字符（足以容纳密集截图的全量逐字转录）。
- **历史图摘要重放**（默认开启）：同一张图在会话历史中再次出现时以 ≤1200 字符摘要重放，首次出现仍为全量转述 —— 长会话不因旧图全量重放而膨胀；可在设置页关闭。
- 理解模型不可用 / 调用失败 / 返回空描述时，以说明性占位文字降级，**不会中断对话轮次**。

## 安装

```sh
dsh plugin --profile web add dsh-mmroute
```

本地开发安装（`<path>` 为本仓库的检出路径）：

```sh
dsh plugin --profile web add <path>/dsh-mmroute
```

`dsh plugin` 是 pnpm 转发器：会把依赖写入 profile 的 `package.json`，并把声明了 `dsh.bundle` 的包自动加入 `dsh.profile.bundles`。安装后**重启 dsh web** 生效。

或手动加入 profile 的 `package.json`（路径相对 profile 目录）：

```json
{
  "dependencies": { "dsh-mmroute": "file:../dsh-mmroute" },
  "dsh": { "profile": { "bundles": ["dsh-mmroute"] } }
}
```

## 使用

1. 打开 **设置 → 多模态路由**（侧边栏底部设置面板内，明暗主题自动适配）。
2. 在「多模态理解模型」下拉中选择：
   - **自动** —— 使用发现的第一个原生多模态模型；
   - 或指定任一候选（含你手动标记为多模态的网关模型）。
3. （可选）在「模型模态标记」里为个别模型显式选择 **默认 / 多模态 / 纯文本**，覆盖自动判定。
4. 直接在对话里粘贴 / 上传图片，或让 agent 调 Figma 等 MCP 工具产生渲染图即可 —— 每一步的新图都会被处理。

> v0.6.0 起设置页只保留理解模型与模态标记两块核心控制；自动路由、报错自愈、历史图摘要等功能**始终在后台运行**（默认开启），如需调整可编辑 `$DSH_HOME/mmroute.json` 里的 `autoText` / `replayDigest` 字段。

配置持久化在本机 `$DSH_HOME/mmroute.json`（默认 `~/.dsh/mmroute.json`），重启后仍然生效；可在设置页一键清除图片转述缓存。

### 标记同步写入 settings.yaml（v0.5.0 起）

在「模型模态标记」里做标记时，插件会**同步写入 `~/.dsh/settings.yaml` 的原生 `input` 声明**：

- **多模态** → 该模型条目写入 `input: [text, image]`
- **纯文本** → 该模型条目写入 `input: [text]`
- **默认** → 删除该模型条目的 `input` 行（重新继承默认）

```yaml
llm-pi-ai:
  providers:
    glm5-3:
      models:
        - id: glm-5.3
          input: [ text ]        # 标记「纯文本」写入
        - id: glm-4.6v
          input: [ text, image ] # 标记「多模态」写入
```

写入走官方 `settings.mutate` 通道：schema 校验、修订号乐观并发（冲突自动重试一次），并触发 pi-ai 适配器**热重建路由 —— 无需重启即时生效，重启后声明仍在**。范围限定 `llm-pi-ai` 命名空间下用户已显式声明 `models` 列表的网关路由（兄弟条目逐字段保持不变）；其他适配器（如 llm-deepseek 硬编码模态）仅插件内标记。同步失败不影响插件内路由，结果在设置页脚注与 API 响应中明示。

## 免费与本地理解模型

理解模型可以是任何声明图片输入的 provider —— 包括免费云模型与本地模型。以下片段合并进 `$DSH_HOME/settings.yaml` 的 `llm-pi-ai.providers` 段（注意：Web「添加自定义提供方」表单不会写入图片能力元数据，视觉模型请手写 `input: [text, image]`）：

```yaml
# 智谱 bigmodel.cn —— glm-4.6v-flash 永久免费（大陆直连）
llm-pi-ai:
  providers:
    zhipu:
      api: openai-completions
      baseURL: https://open.bigmodel.cn/api/paas/v4
      apiKeyEnv: ZAI_API_KEY
      models:
        - id: glm-4.6v-flash
          name: "智谱: GLM-4.6V-Flash (永久免费)"
          contextWindow: 131072
          maxTokens: 8192
          input: [text, image]
```

Key 写入 `~/.dsh/.credentials.yaml`（`ZAI_API_KEY: sk-...`）或导出同名环境变量，重启 `dsh web` 后该模型即可在「多模态理解模型」下拉中使用。其他免费渠道：阿里云百炼（新用户每系列 100 万 token/90 天，`qwen-vl-plus` 等）、硅基流动（Qwen2.5-VL 系列）。**本地 Ollama** 同样适用：把本地视觉模型配为 pi-ai provider（OpenAI 兼容端点 `http://127.0.0.1:11434/v1`，声明 `input: [text, image]`）即可完全离线转述。理解模型全量转述对小模型要求不高，免费额度通常足够。

## 边界行为（发布者自查清单）

| 场景 | 行为 |
| --- | --- |
| agent 流程中途出现新图片（工具返回 / MCP 渲染） | 该步请求在发送前被拦截转述，含 tool-result 嵌套形态 |
| 未标记模型 + 自动纯文本路由开启 | 按适配器声明判定：声明图片直发，否则转述 |
| 未标记模型 + 自动纯文本路由关闭 | 完全保持 harness 原生行为（含原生拒绝） |
| 图片类请求失败（UNSUPPORTED_CONTENT / 网关拒图文案） | 自动转入转述路径并 retry；每路由每进程 ≤2 次 |
| 自愈后再次请求 | 命中内存 override，直接转述（重启后失效，可固定为标记） |
| 理解模型指向纯文本标记的模型自身 | 理解调用失败 → 占位文字降级，无递归（WeakSet 放行自有请求） |
| 无任何多模态模型可用 | 占位文字说明如何配置，对话继续；自愈不触发 |
| 理解调用失败 / 空描述 / 中止 / 限流 | 该图降级为占位文字，对话不中断，其余图片不受影响 |
| 文本模型调用 vision_relook | 对已转述图片聚焦核查：逐字精确作答，看不清/未找到明确说明 |
| 并发请求转述同一张图 | 合并为一次理解调用（in-flight 去重） |
| 同一张图在会话历史中再次出现 | 摘要重放（≤1200 字符，可关闭）；首次出现仍为全量；同一请求内全量始终在场，摘要不损失信息 |
| 超长描述 | 截断至 12000 字符并注明（完整性优先：足以容纳密集截图的全量逐字转录） |
| 缓存 / 标记数量 | 转述缓存上限 300 条（FIFO 淘汰）；标记上限 2000 条 |
| 状态文件损坏 / 字段异常 | 按默认值重新开始，不阻断宿主启动 |
| 会话已有图片时切换到会被转述的模型 | 准入放行（这正是放宽的目的） |
| 会话已有图片时切换到原生拒图模型（自动路由关闭） | harness 原生拒绝（行为不变） |
| provider/model id 含 `/`、引号、Unicode | 精确字符串键 + JSON 编码，无解析歧义 |
| 悬空标记（provider 已移除） | 不显示、不计数、不生效，但保留在状态文件中 |
| 两个浏览器标签页同时写配置 | 每个方法只触碰自己的键，落盘同步无交错 |
| 跨站 / DNS-rebinding 攻击 API | 信任围栏：仅回环或 trustedHosts + 同源标记 + JSON Content-Type + 64KB 上限 |
| 无头配置（无 webServer） | 拦截层照常工作，仅设置页不可用 |

## 与其他视觉插件的对比

以下对比基于对各项目源码的实际阅读（2026-08）。视觉插件已近十款，**其中六项关键能力只有本插件同时具备**：

**只有 dsh-mmroute 做到的：**

1. **零改变使用习惯** —— 挂 `llm/stream`，对每一次模型调用透明生效：不换路由、不选特殊条目、不装任何 CLI，原图直接发进你正在用的模型组；
2. **覆盖 agent 循环之外** —— 子代理、非工具路径的模型直调同样被拦截，其他方案全部以 agent 循环为边界；
3. **图片类报错自愈** —— 网关实际拒图时自动转述并重试，其他方案遇到只能报错停止；
4. **七节全量结构化转述** —— 图型判定 / 全部文字逐字转录 / 图表数据 / 布局 / 颜色 / 异常 / 不确定区申报，附准确性·完整性·防注入三条铁律；其他方案的转述是无结构散文或简单模板；
5. **双模「指挥与执行」协作** —— 任务背景注入 + `vision_relook` 定点复看：作答模型带着当前问题指挥你手选的理解模型聚焦核查，两个模型形成闭环协作；
6. **历史图摘要重放** —— 旧图重放自动降为摘要，长会话不因图片全量重放而膨胀，其他方案均全文重放。

**能力矩阵**（✅ 具备 · ◐ 部分 · ❌ 不具备）：

| 能力 | 本插件 | modlens | vision-router | sidecar | proxy | provider | tool-vision |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 原图直发原模型组（零切换） | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 覆盖 agent 循环外的调用 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 图片类报错自愈 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 结构化全量转述 + 防注入 | ✅ | ◐ | ◐ | ◐ | ❌ | ◐ | ❌ |
| 定点复看 / 任务背景感知 | ✅ | ◐ | ❌ | ❌ | ❌ | ❌ | ◐ |
| 历史图摘要重放 | ✅ | ❌ | ◐ | ❌ | ❌ | ❌ | ❌ |
| 图片只发给你配置的模型 | ✅ | ❌ | ❌ | ❌ | ◐ | ◐ | ✅ |

**各家的取舍**（他们换来了什么）：modlens 借本机 CLI 登录态、跨五个 harness 通用；vision-router / sidecar / proxy / provider 用免费端点或直连换“免配置开箱即用”；tool-vision 提供 15 个像素级工具。若你需要的是这些，选他们没问题——本插件不做引擎供给（不内置免费端点、不借登录态），专注把**你自己选的两个模型**协作到最好，因此开箱前需要先有一个多模态 provider（参见上文「免费与本地理解模型」）。

同装提示：不同插件可共存，但**多套视觉桥会互相短路，只启用一条图片通路**。

## 安全与隐私说明

- 标记与自动判定是**对端点能力的声明，不是检测**：把实际不支持图片的模型标成「多模态」，请求会由供应商报错（与 pi-ai 官方 `input: [text, image]` 声明语义一致）—— 此类报错会被报错自愈捕获并自动降级为转述。
- 理解模型调用会把图片发送给你指定的多模态模型 —— 请自行确认该模型的隐私条款。
- **防注入**：图片内容对作答模型是不可信输入。转述系统指令含防注入铁律（图中指令性文字只逐字转录、绝不执行），转述块头部标注「未经核实的视觉证据」；`vision_relook` 复看同样适用。
- 设置 API 仅接受本机同源请求；插件不上报任何数据。
- `resolveModelInfo` 的遮蔽只影响图片准入与模型目录展示，不参与请求路由校验；插件停用后自动恢复原方法。

## 已知限制

- 当前 DSH 附件系统 v1 仅支持**图片**（PNG / JPEG / WebP / GIF）；视频不在支持范围内。
- 理解模型的 token 消耗独立计费，不出现在主对话的用量统计中。
- 报错自愈依赖失败文案 / 错误码的图片特征启发式（`UNSUPPORTED_CONTENT` + image 字样，或 message 含 image / multimodal / vision / 视觉 / 图片）；无法识别的文案不会触发自愈，但显式「纯文本」标记仍会全程转述。

## 许可

MIT
