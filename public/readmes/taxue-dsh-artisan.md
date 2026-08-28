<p align="center">
  <strong>taxue-dsh-artisan</strong> · taxue 画师
</p>

# taxue-dsh-artisan

[![npm](https://img.shields.io/npm/v/taxue-dsh-artisan)](https://www.npmjs.com/package/taxue-dsh-artisan)
[![GitHub](https://img.shields.io/badge/GitHub-taxue--dsh--artisan-6366f1)](https://github.com/taxueseek/taxue-dsh-artisan)

DeepSeek Harness 的一体化视觉创作工具链：**提示词反推、确定性色卡提取、审计优化、多供应商生图**。基于原反推提示词插件完善而来，并原生整合了多供应商生图能力，成为可灵活组装的单插件。

## 解决什么问题

原来要「反推一张图 → 生成一张图」需要先后调用两个互不相识的插件：一个只出提示词、一个只生图，模型要自己把结构化的 `meta_prompt` 手动搬运成生图的 `prompt`，中间承接全靠试错。

整合后四个原生工具在同一插件内，可单个调用、也可按需串联：反推 → 色卡/优化 → 生图。

## 四个工具

| 工具 | 作用 | 是否调远程 |
|---|---|---|
| `reverse_prompt` | 反推图像/视频提示词并**直出可直接生图的完整提示词**，附带优化方向、画幅建议与同规格同风格新图引导 | 否（本地纯函数） |
| `optimize_prompt` | 对候选提示词做本地结构审计：信息量、相机冲突、构图/动作缺失、硬冲突（风格机制互斥）、模仿/IP 风险、单变量优化建议 | 否（本地纯函数） |
| `extract_palette` | 对 PNG 参考图做**确定性色卡提取**：主色/辅色/点缀色 hex 与占比、暗部/高光锚点色；同一张图永远同一结果 | 否（本地像素算法） |
| `generate_image` | 用配置的供应商生成一张图：Google Gemini / OpenAI / 字节 Seedream / xAI Grok / ChatGPT 订阅；支持参考图对比预览与可选图控图 | 是 |

## 图控图（默认关闭）

`generate_image` 的 `reference_assets` 默认只用于结果卡片里「参考图 vs 生成图」并排对比，不上传。显式传 `use_reference_images: true` 时才把参考图内联编码进生图请求：

- **Google Gemini**：参考图作为 `input_image` 内容块随 prompt 进入 Interactions API。
- **OpenAI / Seedream / codex（gpt-image）**：参考图以 data URL 数组走 `image` 字段。
- **Grok Imagine**：参考图以 data URL 数组走 `image_url` 字段。

开启后生成结果会向参考图的构图、色彩、主体靠拢，适合「照着这张图还原/改画」类任务；要求路径为本地可读的 PNG/JPEG/WebP 文件。默认不带参考图的行为完全不变。

## 确定性色卡提取

`extract_palette` 用本地像素级聚类（Oklab 颜色空间 K-Means，无随机种子、固定迭代轮数），对 8-bit 非隔行 PNG 输出：

1. 主色/辅色/点缀色的 hex 值与占比（点缀色按「高饱和 + 与主辅色拉开距离」评分选出）
2. 暗部锚点色（明度 < 0.3 的簇）与高光锚点色（明度 > 0.87 的簇）
3. 全部颜色及归一化占比

输出 hex 取自「离簇心最近的真实采样像素」，保证颜色真实出现在原图中。反推图像时先调它拿到真实色值再写进提示词，把配色描述从目测升级为像素级精确。JPEG/WebP 参考图需先用 `sips` 等本地命令转 PNG。

## 直出反推（相对原 forge 的任务包模式）

原 forge 把反推输出成「evidence-first 元提示词 + JSON 输出合同」，让模型把它当外包任务执行，与 DSH 单模型环境脱节，模型倾向绕开。本版改为**直出**：

| 输出字段 | 作用 |
|---|---|
| `prompt` | 可直接粘贴到生图工具的完整提示词（还原参考图文字排版、风格与细节） |
| `optimization_advice` | 可执行的优化方向（每一条一个变量） |
| `aspect_ratio` | 从参考图**真实像素宽高**换算的画幅建议（如 9:16）；无像素时回退文本推断 |
| `variant_guidance` | 同规格同风格新图引导 |
| `quality_gate` / `risk_flags` / `clarification_questions` | 质量门、风险与澄清问题 |

模型调用一次 `reverse_prompt` 即可拿到完整结果，再把它直接喂给 `generate_image`，参考图经 `reference_assets` 传入后会在结果卡片与生成图并排预览对比。

### 视觉还原锚点（量身为本插件定做）

反推还原度不足的根因是模型看图没有方法论约束。本插件提炼 **9 个可量化还原锚点**，注入最终提示词，供下游生图模型逐条复现：

1. 画幅锚点：第一句写死「画幅比例：<真实比例>」，正文不再出现第二个比例
2. 气质锚点：首句锁定总体视觉气质，媒介感优先
3. 风格锚点：先证据后定名，赛璐璐/厚涂/柔和渲染判定规则硬编码
4. 表面层锚点：扫描颗粒/柔焦/低清只写作用区域，不得当材质纹理
5. 构图锚点：景别、主体位置、留白、视角各一句，禁止冲突景别
6. 光色材质锚点：主光源、冷暖、饱和度、关键材质固有色与反射
7. 主体锚点：≥3 项独立锚点一致才写具体 IP/角色/品牌
8. 文字锚点：可见文字逐字照抄，注明字体/横竖排/对齐
9. 负向锚点：只留 2-5 个最可能跑偏风险，原图已有特征不得列入

**画幅精确还原**：`reverse_prompt` 新增 `image_width` / `image_height` 参数。模型 `read_image` 后把返回的 `width×height` 填入，插件按真实像素换算最接近的标准画幅（支持 Grok/Seedream 扩展比例），并在提示词第一句写死真实比例——截图/参考图的画幅因此可以精确还原，不再靠文本猜。

## LLM 反推重组（观察描述 → 可生成提示词）

`reverse_prompt` 内置 **LLM 反推重组器**（`llmPolish`，默认开启）：模型 `read_image` 得到的只是「观察描述」，重组器把它按 **6-block 结构化协议** 转译为可直接喂给生图模型的生成指令：

1. 主体与任务：主体是谁/什么、动作、姿态、方向
2. 构图与版式：空间纵深、前后层次、视觉优先级、留白、裁切
3. 视觉风格与材质：风格气质、光源方向与色温、投影、主色数量/色值、材质纹理
4. 文字与标注：可见文字内容、字体、排版、字号关系、内边距
5. 画幅与输出：画幅比例
6. 约束与负向：保持/可改/避免用「没有…」「无…」自然表达

转译原则：去描述语气改生成语气、按题材路由选 block 顺序（装置类构图先行、海报类文字版式加重、人像类主体先行）、无元语言、负向克制。任一环节失败自动回退原提示词。可在设置中指定 `llmPolishProvider` / `llmPolishModel`，关闭 `llmPolish` 即退回纯规则编译。

## Token 优化（相对原 forge）

| 项目 | 原 forge | taxue-artisan | 变化 |
|---|---|---|---|
| 注入体 | 3863 字节任务包 | 直出提示词（约 2178 字节） | **-44%** |
| 反推调用链路 | read_image + 读资料 + 手写长文（8-24 步） | read_image + reverse_prompt 一步直出（2-3 步） | 步数 **-70% 以上** |

手段：

- **默认单语言**：`output_language` 默认 `zh-CN`，不再默认压一份英文元提示词；需要双语时显式指定。
- **直出而非外包**：不再输出需要模型二次执行的「任务包」，直接产出可粘贴提示词，砍掉模型手写长文的多轮。
- **参考图对比**：`generate_image` 接收 `reference_assets` 路径，结果卡片并排显示参考图与生成图。

## 多语言

不局限于中文。`reverse_prompt` 与 `optimize_prompt` 的 `output_language` 参数支持三种取值：

| 取值 | 元提示词 / 审计 / 质量门 / 风险与澄清提示 |
|---|---|
| `zh-CN`（默认） | 全中文 |
| `en` | 全英文 |
| `bilingual` | 中文为主、关键锚点双语 |

`output_language: 'en'` 时，`meta_prompt` 正文、`quality_gate`、`risk_flags`、`clarification_questions`、审计 `warnings`/`summary`/`next_single_variable_test` 均输出英文。

## 保存文件夹（生成图落盘位置可选）

`generate_image` 生成的图除附加到会话外，会落盘到可配置目录，方便追溯。配置路径：**设置 → 插件 → taxue 画师 → 保存文件夹**。

- 填入绝对路径 → 生成图保存到该目录（自动建目录）。
- 留空 → 保存到默认 `~/Downloads/`。
- 落盘文件名：`taxue-image-<时间戳>.<扩展名>`；落盘失败不阻断出图，仅提示。
- **提示词 sidecar**：落盘的同时写同名 `.json`（`taxue-image-<时间戳>.json`），内含完整 prompt、provider、model 与生成时间——图与生成它的提示词不分离，收藏即溯源。

## 供应商

| Provider | 默认模型 | 凭证环境变量 |
|---|---|---|
| Google Gemini | `gemini-3.1-flash-image` | `GEMINI_API_KEY` |
| OpenAI | `gpt-image-2` | `OPENAI_API_KEY` |
| 字节 Seedream | `doubao-seedream-5-0-260128` | `ARK_API_KEY` |
| **xAI Grok** | `grok-imagine-image-2.0` | `XAI_API_KEY` |
| **ChatGPT codex** | `gpt-image-2` | 无需 API Key，走 ChatGPT 订阅 |

> **凭证路由（订阅优先，已实测验证）**：provider 为 grok 且 Grok 订阅已登录时，`generate_image` 自动走订阅出图（无需 API Key，SuperGrok / X Premium 的 OAuth token 对 `/v1/images/generations` 有效）；**codex 走 ChatGPT 订阅（`/backend-api/codex`），登录订阅即可出图，无需 API Key**；未登录订阅或非 grok/codex 供应商用 API Key 兜底；无 API Key 但环境有 Grok 订阅时自动重定向到 Grok 订阅。`generate_image` 声明 `timeoutMs: 180000`。Grok 出图时效：`grok-imagine-image` 约 5-15 秒，`grok-imagine-image-2.0`（默认，质量最高）约 30-60 秒，接近超时建议用 `run_in_background` 后台生图。订阅出图要求网络可达 api.x.ai（走系统代理）；网络层失败已包装为带排查提示的错误（而非笼统的 `fetch failed`）。

> **Grok 兼容性与差异**：xAI 的 `/v1/images/generations` 是 OpenAI 兼容端，但 **不支持 `size`/`quality`/`style` 参数**，只支持 `aspect_ratio` 与 `resolution`。整合时已为 Grok 走独立参数路径——不带 `size`，可选带 `aspect_ratio`——避免收到 400。默认返回临时 URL，插件会立即下载持久化为附件。

## 安装

从 npm 安装（推荐，发布后可用）：

```sh
dsh plugin --profile web add taxue-dsh-artisan
```

从 GitHub 直装：

```sh
dsh plugin --profile web add github:taxueseek/taxue-dsh-artisan
```

本地源码开发时用 file: 引用：

```sh
dsh plugin --profile web add taxue-dsh-artisan@file:/path/to/taxue-dsh-artisan
```

重启 `dsh web`，打开 **设置 → 插件 → taxue 画师** 配置供应商与 API Key（写保护，前端不读回明文）。

## 可选桥接：炭笔动态万物速写

`reverse_prompt` 保留 `dynamic_charcoal_mode` 开关（默认关闭）。开启后元提示词额外锁定「主体类别—受力事件—主轴—深黑锚点—余势」，并按需加抓拍瞬间、低机位/俯拍、切边、时间残线、方向性留白与有限墨彩控制。

## 开发

```sh
pnpm install
pnpm run typecheck   # tsc --noEmit
pnpm run test        # node tests/smoke.mjs（纯函数闭环）
pnpm run build       # tsc && tsdown → lib/
```

## 许可

MIT

## 安装

\`\`\`sh
dsh plugin --profile web add taxueseek/taxue-dsh-artisan
\`\`\`

## 贡献

欢迎提交 PR。

## 卸载

\`\`\`sh
dsh plugin --profile web remove taxueseek/taxue-dsh-artisan
\`\`\`
