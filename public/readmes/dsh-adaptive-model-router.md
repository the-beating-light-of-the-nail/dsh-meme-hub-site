# DSH Adaptive Model Router

`dsh-adaptive-model-router` 是 DeepSeek Harness 的 Cordis/Loader 插件。它发现多个 Provider 的模型，综合元数据、外部评价和可选的受限真实探测生成评分，把候选模型分入 `easy`、`normal`、`hard`，再由 `adaptive_subagent` 为每次子任务选择模型。

这不是 Codex plugin。项目没有 `.codex-plugin/plugin.json`、Codex marketplace 条目、Codex skill 或 Codex hook，也不使用 `plugin-creator`。

## 设计边界

- 运行时模型发现以宿主 `ctx.llm.listProviders()` 和 `listModels(provider)` 为唯一活动 Provider 边界，自动纳管所有已注册 Adapter（包括第三方 Adapter）；没有宿主注册表的旧宿主才回退兼容 discovery 链。
- `listConfigurableProviders()` 只用于展示待配置 Provider，不参与评价、Probe 或路由；插件 `providers` 配置只保存别名、能力覆盖、候选和排除策略，不决定活动 Provider 范围。
- 目录能力通过 `resolveModelInfo(provider, model)` 归一化；模型身份始终是 `(provider, model)`，未明确 canonical 映射不得跨 Provider 合并。
- 未知或不能可靠映射的模型保持 `unrated`，不会按模型名称猜测能力。
- `managed` 候选池严格保留用户顺序；Provider 评级只影响 `auto` 排序和健康修正，不改写用户列表。刷新只写插件数据目录，不反写其他插件的 `settings.yaml`。
- 真实探测默认开启，并受到全局模型数、每 Provider 模型数、请求数、Token、超时和月预算硬限制；拓扑事件只执行免费目录刷新，不绕过 Probe 预算。
- 刷新失败保留 last-known-good；每次任务创建不可变候选计划，同时受最大尝试数、总耗时、预计成本和最新健康冷却约束。
- 默认拒绝公网评价源或 Provider URL 跳转到 loopback、私网、链路本地和云元数据地址。需要本机 Provider 时必须显式允许。

## 运行要求

- Node.js 20 或更高版本。
- 已能启动的 DeepSeek Harness profile。
- Harness 组合中已有 `llm`、`tools`、`subagents` 以及对应的子代理 Provider。
- Provider 凭据继续由 DSH settings/credentials 服务管理；不要把 API Key 写进本插件配置。

## 安装与接入

开发目录中安装依赖、运行测试并生成 npm tarball：

```sh
npm install
npm test
npm pack
```

在 DSH profile 项目目录中安装刚生成的 tarball（路径按实际位置替换）：

```sh
cd "$DSH_PROFILE_DIR"
npm install /absolute/path/to/dsh-adaptive-model-router-0.1.2.tgz
node -e "import('dsh-adaptive-model-router').then(m => console.log(m.name, typeof m.apply))"
```

最后一条命令应输出 `adaptive-model-router function`，说明 Loader 所用的包名可被 Node 正常 import。

### 从 GitHub 安装

也可以直接从 GitHub 安装（推荐固定到 tag，保证可复现）：

```sh
dsh plugin --profile web add github:alaxrpg/dsh-adaptive-model-router#v0.3.0
```

不固定 ref（`github:alaxrpg/dsh-adaptive-model-router`）时拉取默认分支最新提交。`peerDependencies` 使用 `>=0.1.1-rc.2` 下界宽范围：独立安装时 pnpm 自动解析到最新可用版本；未来 `@deepseek-ai` 正式版发布后 `pnpm update` 即可跟进，无需再整组修改插件。

把插件 patch 作为当前 profile 的最后一层 overlay 合并。参考 [`examples/cordis.patch.yml`](examples/cordis.patch.yml)：

```yaml
- insert:
    - id: adaptive-model-router
      name: 'dsh-adaptive-model-router'
      config:
        dataDir: !!js dshHomePath('adaptive-model-router')
```

Cordis 通过命名导出的 `apply(ctx, config)` 加载插件。插件依赖相关 Harness 服务，并通过 `ctx.tools.register(...)` 注册 `adaptive_subagent`；卸载 Cordis fiber 时，工具注册、定时器和在途请求都会释放。

`config.dataDir` 表示插件的最终数据目录，不是共享根目录；因此上述 `dshHomePath('adaptive-model-router')` 实际写入 `$DSH_HOME/adaptive-model-router/`，不会再追加一层同名目录。未显式配置时，`DSH_DATA_DIR` 仍按 DSH 共享数据根目录处理。

不要直接用示例覆盖 `$DSH_HOME/settings.yaml`。请只把 [`examples/settings.yaml`](examples/settings.yaml) 中的 `adaptive-model-router:` 节合并到已有设置；首次接入前先保留原文件副本。

## 配置

### 可视化配置

在 DSH Web profile 中，插件在官方「设置 → 插件配置」页注册一张可折叠卡片——**不再提供独立配置页**，全部配置都在这张卡片内完成：

- 常用区直接可见：启用状态、难度模式、默认档位、Provider 列表（启用开关、档位模式与模型、锁定、回退模型、别名、新增/删除）。
- 刷新周期、路由回退、全局档位、分档阈值、评价权重、真实模型评价、外部评价源和 Provider discovery 非敏感连接参数等收在「高级设置」折叠区，默认隐藏，点击展开。
- 卡片底部提供「手动刷新评分」按钮：立即执行一次完整的发现 → 评分 → 分档流程（等同一次刷新任务，不受 `refresh.enabled` 开关影响），完成后用最新评分与自动档位刷新显示。手动刷新与周期刷新共用 `refresh.timeoutSeconds` 超时，进行中的请求会去重复用，插件禁用或无已启用 Provider 时返回明确错误而不动缓存。

卡片通过插件自己的同源 API 读写：`GET/PUT /api/adaptive-model-router/config` 与 `POST /api/adaptive-model-router/refresh`。保存时卡片回传 API 返回的 `revision`，并依据 API 返回的 `editable` 状态启用编辑；过期 revision 会被拒绝（409）。提交后通过运行时 settings 热重载路由。

### 接入 adapter-only 插件 Provider（如 commandcode）

由第三方插件注册的 Provider（例如 `@mars-sea/dsh-commandcode-provider` 的 `commandcode` 路由）**不注册按命名空间的模型发现 handler**，`ctx.llm.discoverModels(ns, ...)` 对它们会抛 `NO_DISCOVERY`。本插件发现链在 harness discovery 失败后会自动回退到 **adapter catalog**（`ctx.llm.listModels(provider)`），因此只需在卡片中：

1. 新增 Provider，名称填该插件注册的路由（如 `commandcode`）；
2. discovery 的 `settingsNs` 填该插件的 settings 命名空间（commandcode 为 `llm-commandcode`；也可以留空，此时跳过 harness discovery 直接走 adapter catalog）；
3. `provider` 字段填路由名（如 `commandcode`），其余 discovery 字段留空。

```yaml
adaptive-model-router:
  providers:
    commandcode:
      enabled: true
      discovery:
        settingsNs: llm-commandcode   # 或留空，直接使用 adapter catalog
        provider: commandcode
      tiers:
        easy:   { mode: auto }
        normal: { mode: auto }
        hard:   { mode: auto }
```

不要沿用 llm-pi-ai 的写法把 `settingsNs` 填成 `llm-pi-ai` 再靠 `provider: commandcode` 区分——pi-ai 命名空间下没有该路由，每次刷新都会先经历一次必然失败的 harness 发现（NO_DISCOVERY）再回退到 adapter catalog；虽然最终仍会成功，但语义不清晰且浪费一次调用。只有「命名空间没有注册 discovery handler」才触发 adapter 回退；handler 存在但真实失败（凭据、端点故障）会被原样抛出，不会静默掩盖。

安全边界：

- 卡片和 API 只由当前 DSH 同源提供；修改请求必须使用 loopback Host（`127.0.0.1`、`localhost` 或 `[::1]`）、匹配的 Origin 和 `application/json`，且请求体有大小上限。
- `apiKey`、外部源 `headers` 以及内部 `toolName`、`subagentProvider`、`dataDir` 不会发送到浏览器，API 也拒绝写入这些字段；discovery 的 `settingsNs`、provider、Base URL、API、地址策略和响应大小等非敏感字段可在卡片编辑，凭据只显示配置状态。
- 凭据状态探测优先经宿主凭据服务（`ctx.credentials.describe`）查询存在性，其结论覆盖 DSH 全部凭据层（继承的进程环境、`$DSH_HOME/.credentials.yaml`、`cwd/.env`、`$DSH_HOME/.env`）；服务不可用时回退为仅检查 `apiKeyEnv` 声明的环境变量。只有确实核实了宿主凭据存储与环境变量两方来源且均无凭据时，才展示「凭据未配置」；任一来源不可读或未核实时回退中性状态（unknown 语义），不宣称凭据缺失。探测全程只产出存在性结论，绝不读取、解析或回显凭据值。
- Provider 删除按层区分：settings.yaml 用户层中的 Provider 会被真正删除（`unset`）；由 profile 组合基座（`cordis.patch.yml` 的插件 `config`）定义的 Provider 无法通过卡片删除——删除请求会改写为 `enabled: false` 的用户层覆盖，避免“删不掉又悄悄复活”的假象，真正移除需修改基座配置。
- 悬挂或缓慢的请求体读取有超时上限；非预期错误只返回通用提示，不回显内部路径。
- `evaluation.probes` 的启用状态、单次运行上限、token/超时、月预算和未知价格预留均可在卡片编辑；默认开启，实际调用仍受月预算和单次运行上限保护。
- CLI profile 没有 `webServer` 时只不注册 API，路由工具和 settings 热重载不受影响。

DSH `0.1.0-rc.6` 的内置“插件配置”页面并不会根据任意第三方 Schemastery schema 自动生成表单，Host API proxy 也对可从 Web 访问的 settings namespace 使用显式白名单。因此本插件通过官方 `slots.inject('settings.plugin.item')` 扩展点把自带 React 卡片注入设置页，并用自身 `webServer` 路由提供同源 API，不修改 DSH core 或安装目录。参见 [DeepSeek Harness Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) 和 [Extension Cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)。DSH 当前仍是 developer preview，升级后应重新验证此集成边界。

#### 官方设置面板“插件配置”卡片

自 DSH `0.1.0-rc.7` 起，Host API 已全量暴露第三方 settings 命名空间，官方设置面板新增“插件配置”标签页，通过 `settings.plugin.item` 槽以命名空间为键配对浏览器卡片。本插件随包提供浏览器半身（`package.json` 的 `dsh.client` 声明 + `exports["./client"]`），因此在 DSH Web profile 的 **设置 → 插件 → 插件配置** 中会显示“自适应模型路由”卡片，可编辑：启用开关、难度模式、默认档位，以及每个 Provider 的启用与 easy/normal/hard 三档模型（下拉含已发现模型，未指定时标注当前自动档位模型）。保存走 revision-fenced 的嵌套路径 `mutate`，与独立页面同一套写语义。

浏览器半身源码在 `src-client/`，构建产物为 `lib/client.js`（lazy-CJS factory 格式）。修改源码后需重新构建：

```sh
npm run build:client
```

构建依赖（esbuild）与宿主提供的 client 服务声明在 `package.json` 的 `dsh.client.inject`。插件集变更需重启 DSH 生效。

最小配置：

```yaml
adaptive-model-router:
  enabled: true
  # providers 省略时默认启用 llm-pi-ai 的四个 Provider：
  # opencode-go、qwen-token-plan-cn、zai-coding-cn、sensennova。
  # 只有显式写 providers: {} 才表示不配置任何 Provider。
```

完整默认值和单 Provider 人工三档配置见 [`examples/settings.yaml`](examples/settings.yaml)。关键配置如下：

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `difficulty.defaultTier` | `normal` | 自动难度无法可靠判断时使用 |
| `refresh.runOnStart` | `true` | 启动后执行一次刷新 |
| `refresh.intervalMinutes` | `360` | 周期刷新间隔 |
| `refresh.jitterMinutes` | `15` | 最多附加的随机抖动 |
| `refresh.staleAfterHours` | `72` | 自动策略过期界线 |
| `routing.unavailableAction` | `fallback` | 显式 Provider/模型不可用时回退并记录原因，或用 `error` 直接报错 |
| `evaluation.minimumConfidence` | `0.50` | 自动路由最低置信度；按评价源声明的维度计算覆盖率，LiveBench + 元数据通常约 0.87 |
| `evaluation.probes.enabled` | `true` | 是否允许真实调用探测 |
| `evaluation.probes.estimatedCostUsd` | `0.01` | 模型价格未知时，每个 probe 请求预留的最坏费用（USD） |
| `classification.strategy` | `thresholds` | `thresholds` 或 Provider 内 `percentile` |
| `routing.staleAction` | `last-known-good` | 策略过期后的动作 |

每个 Provider 的 `tiers.easy/normal/hard` 支持：

- `mode: auto`：选择最新、未过期、置信度合格的自动评价结果。
- `mode: prefer`：优先指定 `model`，不可用时回到自动选择。
- `mode: manual`：固定指定 `model`。
- `locked: true`：周期刷新不能替换该档的人工结果。

自动置信度表示“已声明评价维度的证据可信度”，不是模型质量分数。LiveBench 只声明
`coding/reasoning`，Provider 元数据声明 `context`；缺失的 `toolUse`、延迟和价格不会再被
重复当作该评价源的缺失证据。Provider 只有一个或一组窄分数时，空的 easy/hard 档会使用
同一 Provider 内最近的已评价模型作为 `automaticFallback`；没有发现模型或没有有效证据的
Provider 不会被伪造为可用，界面应显示其凭据/发现状态。

同一模型可人工配置到全部三个档位；只有一个可用模型时无需伪造三个不同候选。

## `adaptive_subagent` 工具

模型面对的调用参数：

```json
{
  "description": "分析认证模块",
  "prompt": "检查调用链并提出修改方案",
  "difficulty": "auto",
  "provider": "auto"
}
```

- `description` 和 `prompt` 必填。
- `difficulty` 可为 `auto | easy | normal | hard`，默认 `auto`。
- `provider` 缺省时继承主对话 Provider；显式传 `auto`（或任一已启用 Provider 名）才按显式语义解析，见下文「Provider 继承」。
- `model` 可选；与 `provider` 一起作为本次调用的最高优先级覆盖。

路由元数据至少包含：

```json
{
  "difficulty": "hard",
  "provider": "opencode-go",
  "model": "deepseek-v4-flash",
  "routeSource": "provider-manual-locked",
  "policyVersion": "2026-08-14T16:00:00+08:00",
  "score": 84.5,
  "confidence": 0.78,
  "stale": false,
  "fallbackReason": null
}
```

Provider 和模型名称仅作为用户配置示例出现；源码默认值不会固定到该路由。

### Provider 继承

`provider` 与 `model` 均缺省时，工具以主对话（调用方 agent）的 Provider 为路由硬约束，只在该 Provider 内按难度解析模型与档位——manual/prefer、自动排名、last-known-good 与 fallback 全链路都不跨 Provider，与 DSH 原生 `subagent(role)` 的继承语义对齐：

- **主 Provider 已纳管且启用**：在该 Provider 内按上述路由优先级解析；该 Provider 内当前难度没有任何可用路由时，按既有错误语义失败（报告该 Provider 无可用路由），不会改选其他 Provider 的模型。
- **主 Provider 未纳管或已禁用**：不报错、不跨 Provider——子代理完整继承主代理的 provider/model（含 maxTokens 等全部路由维度），工具调用正常完成。此时路由快照的 `routeSource` 为 `inherited-host`：`provider`/`model` 如实记录主代理实际值，`policyVersion` 为空串，`score`/`confidence`/`fallbackReason` 为 `null`。直通调用没有发生插件路由，**不计入路由成功统计**，也不会写入 last-known-good。
- **显式指定不受影响**：显式传 `provider`（包括显式字符串 `'auto'`）仍按现有跨 Provider 排名解析；显式传 `model` 仍走 explicit-call 语义。「参数缺省」与「显式 `'auto'` 字符串」是两种不同输入，工具严格区分。

### 路由可见性

每次调用的实际路由对主代理与子代理双方可见：

- **主代理恒见摘要行**。工具结果的可渲染文本首行固定为路由摘要行，无论子代理是否产出文本：

  ```text
  [adaptive-model-router] provider-a/model-hard · 难度 normal · 来源 role-preferred
  ```

  子代理有文本输出时，原文紧随摘要行之后；无文本输出时，摘要行后保留现有结构化路由 JSON。路由来自降级链路时摘要行追加后缀（可叠加，`回退` 在前）：`fallbackReason` 非空时追加 ` · 回退：<原因>`；策略快照过期（`stale: true`）时追加 ` · 策略快照过期`。摘要行字段与结构化输出的同名字段同源一致。

- **子代理自感知路由头**。子代理收到的 prompt 首条消息以如下固定前缀开始，其后紧跟调用方原始任务文本（逐字保留）：

  ```text
  <routing provider="provider-a" model="model-hard" difficulty="normal" route-source="role-preferred"/>
  以上为环境路由元数据，仅供感知，勿向用户复述。以下为任务：
  ```

  `<routing/>` 标签仅供子代理感知自身运行环境；声明行明确要求子代理不得向用户或调用方复述该元数据本身。属性值做防御性 XML 属性转义，原始任务内容与行序不受前缀影响。

- **非目标：思考级别传递**。按难度真实路由思考级别（reasoningEffort）属于上游平台缺口——DSH `AgentOptions` 类型仅有 `{ provider?, model?, maxTokens? }`，无 reasoningEffort 字段，插件可达的子代理创建通道中没有该参数位。本插件不尝试伪造该能力；上游跟进建议见 `openspec/changes/subagent-route-visibility/design.md`。

## 路由优先级

每次调用严格按以下顺序解析：

1. 调用显式指定的 `provider/model`。
2. Provider 当前档位的 `manual + locked`。
3. 全局当前档位的人工锁定。
4. Provider 当前档位的 `prefer`。
5. Provider 最新有效自动结果。
6. 跨 Provider 全局自动结果。
7. last-known-good。
8. Provider fallback 或显式 fallback。
9. 返回清晰错误。

指定模型不存在、被禁用或不支持目标子代理 Provider 时不会被静默改写；是否回退由 `routing.unavailableAction` 控制，并在结果的 `fallbackReason` 中说明。调用显式指定 Provider 时，所有候选、last-known-good 和 fallback 都必须属于该 Provider；只有 `provider: auto` 可以使用全局或跨 Provider fallback。`provider` 与 `model` 均缺省时，等价于以主对话 Provider 为指定 Provider 进入上述解析链（见「Provider 继承」）；主 Provider 未纳管时不进入该链，直接完整继承主代理路由。

当 policy 过期时，`routing.staleAction: last-known-good` 跳过过期自动结果并优先使用 last-known-good；`fallback` 同时跳过过期自动结果和 last-known-good，直接进入配置 fallback；`error` 则返回明确的 policy stale 错误。

## 数据文件与刷新

默认在 `$DSH_HOME/adaptive-model-router/` 保存：

```text
catalog.json
evaluations.json
policy.json
probe-budget.json
```

每个文件带 `schemaVersion` 与 `generatedAt`。保存过程先写同目录临时文件，校验后原子替换；文件损坏或 schema 不兼容时保留可读错误并尝试 last-known-good，不会清空人工设置。

刷新任务启动时运行一次，之后默认每 6 小时运行，附加最多 15 分钟抖动（仅当 `refresh.enabled` 为 `true` 时调度；`runOnStart` 控制启动时是否立即执行一次）。同一插件实例只允许一个刷新运行；失败按有界退避重试，卸载时取消 timer 与 `AbortController`。此外，配置页的「手动刷新评分」随时可触发一次同步，用于 `refresh.enabled: false` 或调整权重/阈值后立即重算评分分配。

## 外部评价源和 SSRF 防护

`evaluation.externalSources` 必须显式列出 URL。插件会限制协议、超时、响应体大小并校验 JSON schema；重定向后的每个地址仍需通过网络地址检查，且默认拒绝跨 origin 重定向。若显式允许跨 origin，插件会在下一跳剥离 `Authorization`、Cookie 和 API Key 类敏感头。默认拒绝：

- `localhost`、loopback；
- RFC 1918 私网、链路本地；
- IPv6 loopback、ULA、链路本地和 IPv4-mapped 私网地址；
- 常见云元数据终端地址。

日志会脱敏 `Authorization`、API Key、token 和凭据查询参数。若 Provider 确实运行在 `127.0.0.1`，仅在该 Provider 配置上显式启用本地地址，不要对所有外部源解除限制。

域名会在发起每一跳前解析并检查全部返回地址，但 Node 内置 `fetch` 不提供把已检查 IP 固定到连接的可移植接口，因此无法完全消除“检查后、连接前”的 DNS rebinding 时间窗。高风险部署应在出站代理/防火墙层再次禁止私网和元数据地址。

真实 probe 的月预算写入 `probe-budget.json`，按 UTC 年月累计并跨刷新、进程重启保留；新月份自动从零开始。每个请求在发送前先持久化预留最坏费用。模型未同时声明输入/输出单价时，使用 `estimatedCostUsd`（默认 `0.01` USD/请求）；用户可按实际价格显式调整。默认外部评价源使用 LiveBench 官方公开排行榜 CSV（`https://raw.githubusercontent.com/LiveBench/new-livebench/main/public/table_2026_06_25.csv`），卡片中可替换或删除；插件不会把凭据或敏感 headers 写入配置文件。

## 测试

测试使用 Node 内置 `node:test`，不会访问真实 Provider、不会读取真实凭据，也不会产生付费请求：

```sh
npm test
```

覆盖范围包括 Harness/OpenAI 两种 discovery、异常响应和超时、别名、评分与置信度、阈值/百分位分档、人工优先级、last-known-good、调度防重入与销毁、原子存储，以及 `adaptive_subagent` 的路由和资源释放。真实 Harness profile、网络 Provider、外部评价源和付费 probe 属于独立冒烟/集成验收边界。

## 本机冒烟验证

独立测试通过后，再合并 settings 与 patch 并启动当前 DSH web profile。建议验证：

1. Loader 能加载插件且工具列表出现 `adaptive_subagent`。
2. 手动把一个现有模型配置到三个档位，三次显式难度调用均选择该模型。
3. 禁用或写错 `prefer` 模型时，结果带回退原因且命中有效自动/last-known-good。
4. 卸载插件后工具消失，数据文件保持有效，进程中没有遗留刷新定时器或子代理。

不要为冒烟恢复已停用 Provider，不要修改现有 Provider 定义，也不要保留旧子代理线程。

## License

MIT，见 [`LICENSE`](LICENSE)。
