# dsh-tool-weather — DeepSeek Harness 天气插件

为 DeepSeek Harness（DSH）注册一个模型可直接调用的 `weather` 工具：查询任意城市/坐标的当前天气、逐日预报与逐小时预报。数据来自公开的 [Open-Meteo](https://open-meteo.com/) API，**无需 API Key**，全球覆盖，支持中文地理编码。

## 一、实现方案总览

### 1. 插件形态：profile bundle

DSH 的插件体系基于 Cordis：宿主进程运行一份 `cordis.yml` 组合（composition），插件以 **bundle** 形式向组合注入自己的配置行。一个 bundle 就是一个 npm 包，其 `package.json` 声明：

```json
"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
```

`cordis.patch.yml` 是加载器 patch 列表（`insert` 追加配置行 / 按 `id` 覆盖既有行）。本插件的 patch 向组合插入一行：

```yaml
- insert:
    - id: weather
      name: dsh-tool-weather
```

安装流程：`dsh plugin --profile <name> add <包>` 在 profile 目录里执行 pnpm 安装，随后自动把声明了 `dsh.bundle` 的依赖追加到 profile 清单的 `dsh.profile.bundles` 层叠列表（按依赖顺序，最后写入者生效），下次启动即挂载。

### 2. 插件内部结构（lib/index.js）

插件本体是一个标准 Cordis 插件：

| 导出 | 作用 |
| --- | --- |
| `name` | 插件名 `tool-weather`（loader 诊断用） |
| `inject` | 硬依赖服务：`tools`（工具注册表）、`systemPrompt`（提示词片段注册表） |
| `Config` | schemastery 配置 schema，profile 配置行可覆盖 |
| `apply(ctx, config)` | 注册 `weather` 工具 + 系统提示词引导段；注册随插件停用自动注销 |

### 3. 数据流

```text
模型调用 weather(location, days?, units?)
  └─ resolveLocation: 城市名 → Open-Meteo 地理编码 API（或直接解析 "lat,lng"）
       └─ fetchForecast: 坐标 → 预报 API（current/hourly/daily，时区 auto）
            └─ projectForecast: 原始 JSON → 封闭的规范输出值（含中/英天气文案）
                 └─ render: 输出值 → 有界 Markdown 文本（模型所见即所得）
```

### 4. 关键技术决策

- **数据源选型 Open-Meteo**：免费、无 Key、无需注册、支持中文地理编码与 WMO 天气码本地化、允许商业使用。对比：

  | 数据源 | API Key | 中国精度 | 免费额度 | 结论 |
  | --- | --- | --- | --- | --- |
  | Open-Meteo | 无 | 中（全球再分析+模型） | 无硬限制 | ✅ 默认 |
  | 和风天气 QWeather | 需要 | 高（国内网格） | 有限 | 需 Key，可作备选 provider |
  | OpenWeatherMap | 需要 | 中 | 有限 | 需 Key |
  | wttr.in | 无 | 中 | 宽松 | 仅文本，结构弱 |

  `geocodingBaseUrl` / `forecastBaseUrl` 可配置，将来换源或走镜像/代理不用改工具契约。

- **网络层直接用 Node 全局 `fetch`**（与 `@deepseek-ai/dsh-llm-deepseek` 一致），不依赖 `ctx.web` seam——headless profile 没有挂载 web fetch provider 时工具依然可用。请求合并调用方取消信号（`exec.signal`）与固定超时预算（`timeoutMs`）。

- **输出即封闭 JSON**：`output.schema` 声明完整结构（`additionalProperties: false`），`render` 生成有界 Markdown（逐小时最多渲染 12 行），`presentationMeta` 供 UI 卡片。错误（查无地点、HTTP 失败、超时、取消）均为带上下文的普通 Error，工具框架统一转成 `isError` 结果。

- **并发安全**：`isConcurrencySafe: () => true`（无共享可变状态，WMO 码表只读）。

## 二、安装与启用

```powershell
# 在插件包所在目录（工作区根）执行；-w 为 pnpm 9 工作区标志
cd D:\dingzd\ai-coding\天气
dsh plugin --profile web add -w ./dsh-tool-weather   # 或 desktop / 自建 profile
dsh --profile web --dump-config | Select-String weather   # 确认挂载
```

重启 dsh（插件随 profile 层叠在启动时加载），模型即可调用 `weather` 工具。

## 三、配置项（profile 的 cordis.patch.yml 覆盖）

```yaml
- id: weather
  config:
    enabled: true        # false 则完全不注册
    language: zh         # zh | en，天气文案语言
    defaultUnits: metric # metric | imperial
    maxDays: 7           # days 参数上限（1..16，Open-Meteo 上限）
    timeoutMs: 15000     # 每次请求超时预算
    # geocodingBaseUrl: https://geocoding-api.open-meteo.com/v1
    # forecastBaseUrl: https://api.open-meteo.com/v1
    # ipGeolocationBaseUrl: https://ipwho.is   # IP 自动定位服务
```

## 四、工具契约

`weather(location, days?, units?)`

- `location`（可选）：城市名（`北京`、`Tokyo`、`New York`）、`"39.9075, 116.3972"` 坐标；**省略或传 `"auto"` 时按本机公网 IP 自动定位**。
- `days`：1..maxDays，默认 maxDays。
- `units`：`metric`（°C/km/h/mm）或 `imperial`（°F/mph/in）。

返回：`{ location, latitude, longitude, timezone, units, updatedAt, current{...}, daily[], hourly[] }`，其中 current/daily/hourly 每行带 `weatherText`（WMO 天气码 → 中/英文案）与原始 `weatherCode`。

## 四·五、顶部天气条（v0.2.0）

浏览器半边（`lib/client.js`）在会话顶部操作区注册一个天气芯片（slot `conversation.session.header.actions`），始终显示：

- **位置**：城市名（或 IP/浏览器定位标记）
- **温度**：当前气温（°C/°F，随 `defaultUnits`）
- **天气**：emoji + 文案（WMO 码本地化）
- **降水概率**：今日降水概率（💧%）
- **时间点**：数据观测时刻（HH:mm，来自 Open-Meteo `current.time`）

交互：**悬停**显示完整明细（体感、湿度、风、今日高低温、数据时间）；**点击**立即刷新；每 `refreshMinutes` 分钟自动刷新。

数据来源与宿主工具相同（Open-Meteo，浏览器直连，CORS `*`），无需宿主往返。定位优先级：配置的 `location` → 浏览器地理定位（需授权）→ 公网 IP。定位失败时芯片显示 ⚠️ 并可点击重试。

客户端实现自包含：仅依赖 `react`（内核提供），遵循 `dsh.client` 双面包契约（宿主半 `lib/index.js` + 浏览器半 `lib/client.js`），同一配置行同时驱动工具与 UI。
## 五、IP 自动定位

支持不传 `location`（或传 `"auto"`）：先请求公网 IP 地理位置服务（默认 [ipwho.is](https://ipwho.is/)，免费、HTTPS、无需 Key，坐标字段齐全）拿到近似经纬度与城市名，再走同样的 Open-Meteo 预报流程。输出中 `locationSource: "ip"`，渲染文本带 `（IP 定位）` 标记与精度提示。

**已知限制（务必向用户说明）**：

- IP 定位得到的是**出口网络的粗粒度位置**（城市级），受 VPN、运营商 NAT、CDN 出口影响可能偏离实际所在地；例如本机公网出口显示香港。
- 定位发生在 DSH 宿主进程侧（服务器侧），不是浏览器侧。
- 实测候选：ipwho.is ✅、ipapi.co ❌ 403、ipinfo.io ⚠️ 无 token 不返回坐标；`ipGeolocationBaseUrl` 可切换到其他兼容服务。

## 六、测试

```powershell
pnpm install   # 首次
node test/smoke.mjs   # 12 项断言：参数校验/地理编码/预报/格式化/英制/坐标/失败路径
```

另已在临时 `headless` profile 上完成端到端验证：`dsh plugin add` → reconciler 自动入列 `dsh.profile.bundles` → `--dump-config` 确认 `weather` 行挂载 → headless Agent 实际调用工具返回天气。

## 七、发布到插件市场

DSH 没有独立的插件市场仓库——分发渠道即 npm registry（`dsh plugin add <包名>` 由 pnpm 从 npm 安装）。发布即 `npm publish`：

```powershell
cd D:\dingzd\ai-coding\天气\dsh-tool-weather
npm login                      # 需要 npm 账号（一次性，凭据保存在本机）
npm publish                    # 发布到 registry.npmjs.org
# 验证：
npm view dsh-tool-weather version
# 任意机器安装：
dsh plugin --profile web add dsh-tool-weather
```

发布包已验证：`npm publish --dry-run` 通过（4 文件 11.2 kB），包名 `dsh-tool-weather` 未被占用。版本迭代：改 `package.json` 的 `version` 后重新 `npm publish`。

## 八、扩展方向

- **多 provider 适配**：按 `dsh-web` 的 provider 模式抽象 `WeatherProvider`，新增 QWeather/OpenWeatherMap 实现，config 选择 provider。
- **结果缓存**：按 `(location, days)` + 15 分钟 TTL 缓存，减少上游调用。
- **客户端卡片**：通过 Client Slot 为 `weather` 调用注册专用结果卡片（当前回退到通用卡片，正文即渲染文本）。
- **地理编码反向解析**：坐标输入时用 Nearby Search 或行政区名称反向补全显示名。