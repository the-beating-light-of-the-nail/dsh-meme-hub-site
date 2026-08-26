# dsh-usage-meter

DSH（DeepSeek Harness）模型用量仪表盘插件。在设置页新增「用量」板块，按服务商/模型汇总全部会话的 token 用量，支持今日 / 近 7 天 / 近 30 天三档时间范围趋势图。

- 官方 bundle 格式：`package.json` 声明 `dsh.bundle`，随 `dsh plugin add` 自动加入 profile 层栈
- 零外部依赖：Host 端只用官方 Cordis 服务（`sessions` / `fs` / `sessionQuery` / `webServer`）与官方内置包 `@deepseek-ai/dsh-home-paths`，不 import 任何第三方包
- 历史回放走官方 `ctx.sessionQuery`（live-preferred 语料），持久层内部完成 zstd 解压与回放校验，不依赖外部命令
- 数据落盘 `$DSH_HOME/storages/usage-meter.json`，经 `ctx.fs.writeText` 原子写（tmp + rename）
- 完全被动：只在本机监听会话事件，不联网、无遥测

## 功能

- 汇总卡：请求数 / 总 Token / 缓存命中率 / 输入 / 输出 / 缓存读取
- 时间范围：今日（24 根小时柱）/ 近 7 天 / 近 30 天（按天柱），本地时区切日
- 服务商表、模型表：请求数、输入、输出、缓存读取、总 Token
- 60s 自动轮询 + 手动刷新
- 全部会话都计入（含子 agent 会话）

## 数据口径

- 只统计 `assistant/message` 且带 `usage` 的事件（失败请求无 message，不计）
- 归属取 `data.message.source.provider / model`
- 缓存命中率 = `cacheRead ÷ (input + cacheRead)`
- 不做费用估算，不做逐请求日志表

## 安装（官方方式，dsh web profile）

插件已发布到 npm，并声明 `dsh.bundle` manifest：

```bash
dsh plugin --profile web add dsh-usage-meter
```

`dsh plugin add` 会将包追加进 profile 的 `dsh.profile.bundles` 层栈，其 `cordis.patch.yml` 自动插入插件行；client 部分经 `dsh.client` 声明被 `dsh-client-modules` 扫描进 `__DSH_BOOT__`。

安装后重启 `dsh web`（或刷新页面加载 client bundle），打开 设置 → 用量 即可查看。

## HTTP 接口

| 接口 | 说明 |
|---|---|
| `GET /dsh-usage-meter/summary?range=today\|7d\|30d` | 汇总 + byProvider + byModel + series（今日按小时、其余按天），全部按 range 过滤 |
| `GET /dsh-usage-meter/sessions` | 每会话对账数据 `[{sessionId, watermark, requests, totalTokens, provider, model}]` |

`summary` 返回字段：

```jsonc
{
  "updatedAt": "2026-08-15T01:06:33.031Z",
  "range": "today",
  "requests": 36, "inputTokens": 19049, "outputTokens": 42036,
  "cacheReadTokens": 4378368, "cacheWriteTokens": 0,
  "totalTokens": 4439453, "cacheHitRate": 0.995668,
  "byProvider": [{ "provider": "opencode-go", "requests": 36, /* ... */ }],
  "byModel": [{ "provider": "opencode-go", "model": "deepseek-v4-flash", "requests": 36, /* ... */ }],
  "series": [{ "label": "08:00", "requests": 28, "totalTokens": 3240870, "cacheReadTokens": 3199360 }]
}
```

## 数据存储与幂等

- 启动回填：`ctx.sessionQuery.listSessions()` 列出全量会话语料；活会话折内存 `session.events` 全量 + `session/event` 事件增量，历史会话经 `ctx.sessionQuery.readSession()` 读完整原始日志
- 每会话存 watermark（已折最后 seq），重复回放不重复计数；会话日志变短（最后 seq < watermark）则清空该会话重折
- 变更 debounce 2s 后经 `ctx.fs.writeText` 原子写 `usage-meter.json`

## cc-switch 用量同步

插件同时把每个带 usage 的事件写入 [cc-switch](https://github.com/farion1231/cc-switch) 的用量数据库（`~/.cc-switch/cc-switch.db`），使其「用量统计」的「全部」视图可以和其他 CLI 一起看到 DSH 的 token 用量：

- 行标识：`app_type='dsh'`、`data_source='dsh_session'`、`request_id='dsh:<会话ID>:<seq>'`；`input_token_semantics=2`（input 不含 cacheRead）；费用一律写 0，只搬 token
- 幂等：判重只查 `session_usage_dedup`（该表永不清理；cc-switch 归档会删 `proxy_request_logs` 旧明细，不能拿明细表判重）；日志行与 dedup 行同事务写入，短事务 + `busy_timeout=5000` + BUSY 退避重试
- 跨源 proxy 指纹去重：DSH 请求经 cc-switch 的 Claude/Codex proxy 时，proxy 用不同 `request_id` 已记同一用量。写入前按指纹（`app_type` 跨 `dsh→claude/codex`、`model`、`input/output/cache_read`、`created_at` ±600s）匹配 `data_source='proxy'` 的行，命中即跳过且不写 ledger（以便 proxy 行日后被归档删除时下次同步能补导）。对齐 cc-switch PR [#6724](https://github.com/farion1231/cc-switch/pull/6724) review fix 写入侧
- 同步时机：复用 debounce 落盘路径（回放回填与活会话增量同一条幂等路径）；一次性历史回填可用 `node scripts/backfill-ccswitch.mjs`（`--dry-run` 只读对账；首次写真库前自动把库备份到仓库 `backups/`）
- `created_at` 为秒级 epoch（与库内既有行一致），来自事件 `time`（毫秒）取整
- 开关：环境变量 `DSH_CC_SWITCH_SYNC=0` 关闭（默认开）；`DSH_CC_SWITCH_DB` 可覆盖目标库路径（测试用）

## 开发

```bash
node test/verify.mjs   # 自包含合成测试：口径 / 幂等 / 日志变短 / summary 自洽 / cc-switch 同步
```

## License

[MIT](./LICENSE)
