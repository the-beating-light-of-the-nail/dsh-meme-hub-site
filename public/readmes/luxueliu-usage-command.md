# luxueliu-usage-command

> 🧾 **内置DSH指令，一键展示今日全局付费模型总消耗账单（人民币版）！**

`/usage` — DeepSeek Harness 的本机 API 花费价目卡命令（¥ / 按日 / 分小时）。

由 [luxueliu](https://github.com/luxueliu) 制作并开源。数据源是本机 LiteLLM 网关的落账文件 `gateway_usage.jsonl`，按官方公布价计价，输出「按本地别名 × 分小时」的当日 ¥ 消费卡。

## 这是什么

- 一个 DSH指令：在对话输入 `/usage`，立即得到价目卡。
- **三类付费模型全覆盖计价，计价货币跟随时区**：
  1. 官方直连类（例如DeepSeek 官方 API）；
  2. 中转商类（OpenRouter / 各家中转 API）；
  3. 套餐内的计费池类（自动排除阿里百炼 Token Plan、ClinePass 等套餐内的限额模型，仅计价付费池内的非免费模型）。
- **模型表可自由扩展**：在 cordis config 里用 `dsModels` / `usdModels` / `planModels` 任意添加你自己的网关模型与价格，`aliases` 还能把网关落账里的旧模型名/别名映射到新名字（见下方配置）。没有价目的未知模型自动归入"其他/退役别名"兜底，只列 token，绝不误入今日计费。
- **时区/币种自适应**：自动探测系统 locale 与时区——中国用户看到 ¥ + 北京时间，美国用户自动切换 $ + 美东时间，港台用户 NT$/HK$ 同样可用；ds 峰谷价格始终按北京时间（北京电价峰谷），不随用户地区漂移。
- 不落账：Cursor 编辑器直连、DeepSeek 官方直连（DSH harness 官方通道等旁路）。

## 与官方 dsh-usage 的区别

官方 `dsh-usage`（kestiny18 出品）读 Harness 会话日志，**仅显示DSH平台消耗**。

本插件走本地LiteLLM 网关落账，统计全局LLM消费（只要是经由网关出入的），不限平台。

## 安装

要求：Node.js 22.18+ 与一个 DeepSeek Harness Web profile（如无DSH，也可以让ds帮你把插件适配到其它harness上^_^）。

```powershell
# 方式一：GitHub 仓库
dsh plugin --profile web add github:luxueliu/luxueliu-usage-command

# 方式二：npm（若已发布）
dsh plugin --profile web add luxueliu-usage-command
```

重启 DSH 后在对话输入：

```
/usage
```

## 配置

插件随包 `cordis.patch.yml` 已带默认配置；需要改路径/币种/时区时，在 profile 的 `cordis.patch.yml` 覆盖：

```yaml
- insert:
    - id: luxueliu-usage-command
      name: luxueliu-usage-command
      config:
        gatewayLog: "D:/your/path/gateway_usage.jsonl"   # 落账文件；留空自动探测
        currency: "CNY"          # CNY | USD | TWD | HKD；留空按系统 locale
        timezone: "Asia/Shanghai" # IANA 时区；留空取系统时区
        cnyPerUsd: 7.2           # 人民币兑美元汇率
        showRateLegend: true     # 报表尾部是否打印单位价图例
        tailBytes: 0             # >0 只读文件末尾 N 字节（大文件加速）
        debugLog: false          # 写 ~/.dsh/luxueliu-usage-command.log
```

或设置环境变量 `LUXELIU_USAGE_GATEWAY_LOG` 指向落账文件。

### 自由扩展三类模型（核心能力）

不需要改代码——在 profile 的 `cordis.patch.yml` 里给你的网关模型加价目即可：

```yaml
- insert:
    - id: luxueliu-usage-command
      name: luxueliu-usage-command
      config:
        # 第一类：官方直连类（人民币计价，可配峰谷小时，peakHours 命中 ×2，按北京时间判定）
        dsModels:
          "my-official-model": { hit: 0.2, miss: 2.0, out: 6.0, peakHours: [9,10,11,14,15,16,17] }
        # 第二类：中转商/OpenRouter 类（美元计价，unit 可改 CNY）
        usdModels:
          "my-relay-model": { hit: 0.5, miss: 2.0, out: 8.0, note: "我的中转商" }
        # 第三类：套餐池（固定月费，不计价，仅列 token）
        planModels:
          - "my-plan-model"
        # 网关落账 model 字段 -> 本地别名（兼容旧名/历史别名）
        aliases:
          "my-relay-model-v2": "my-relay-model"
```

## 命令

```
/usage             # 今天
/usage today       # 今天
/usage yesterday   # 昨天
/usage 08-20       # 指定月-日（今年）
/usage all         # 全量（无分小时，只有按模型汇总）
```

## 计价口径

- 价格来自官方公布价（联网核实 2026-08），见代码内 `DS` / `PRICES` 表；改价请更新两处（本插件 + [usage-price-report](https://github.com/luxueliu/luxueliu-usage-price-report) skill）。
- DeepSeek 峰谷价：高峰 9:00-12:00 / 14:00-18:00（本地小时 9,10,11,14,15,16,17）为低谷 ×2；2026-08-23 起周末（周六+周日）全天按低谷价计费；
- 汇率默认 7.2（USD→CNY），可配。
- 缓存拆分：优先 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`；缺省用 `prompt_tokens_details.cached_tokens`；再缺省整段按未命中计。

## 已知缺口

- DeepSeek 官方直连（不经本地网关）的用量不在本账内，官方账单会高于本插件数额。
- gemini 的 Vertex 缓存价 `in×0.25` 标待核实。
- 只统计网关落账文件中的调用（含 Codex 等走网关的用量）。

## License

MIT © luxueliu
