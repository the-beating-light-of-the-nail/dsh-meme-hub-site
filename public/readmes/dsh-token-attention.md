# dsh-token-attention — Token Check for DeepSeek Harness

English | [中文说明](README.zh.md)

**Token Check** is a token-attention management panel for [DeepSeek Harness](https://github.com/deepseek-ai/dsh) (DSH). It records every conversation's token usage and estimated cost by **task / day / week / month**, recognizes task types, and — combined with DeepSeek's peak/off-peak pricing and DSH's context mechanics — tells you **when to run a task, whether to switch sessions, and whether to write a hand-off file**.

It is not a money-saving tool: it never throttles or cancels requests. It presents facts and advice; you decide.

## Features

- **Five views in DSH Settings** — Overview / Sessions / Tasks / Cost / Settings
- **Per-task ledger** — token consumption (input hit / miss / output / reasoning) and estimated cost, rolled up by day / week / month
- **Task-type recognition & advice engine** — best execution window, switch-session, hand-off, context, cost and model suggestions
- **Attention KPI** — attention score, hit rate, context occupancy, compaction count per session
- **Peak/off-peak pricing** — DeepSeek off-peak half-price windows (peak 9:00–12:00 / 14:00–18:00), estimated cost breakdown by bucket
- **Multi-model breakdown** — cost and hit rate per model (e.g. deepseek-v4-flash / pro / grok)
- **Ledger export** — Markdown / CSV download, one-click hand-off template
- **Editable settings** — pricing table, peak hours, advice thresholds; new records are priced immediately
- **Zero runtime dependencies** — local SQLite via `node:sqlite`; no network calls

## Screenshots

**Overview** — today's usage, cost, hit rate, attention score, model mix, advice card, and trend

<img src="https://raw.githubusercontent.com/Young4ever33/dsh-token-attention/f0f3e90b32f04655e0f5388baa603ec62b8cfe40/docs/screenshots/1-overview.png" alt="Overview" width="760">

**Session card** — per-session model breakdown and attention metrics

<img src="https://raw.githubusercontent.com/Young4ever33/dsh-token-attention/f0f3e90b32f04655e0f5388baa603ec62b8cfe40/docs/screenshots/2-session.png" alt="Session card" width="760">

**Tasks** — task ledger with Markdown / CSV export

<img src="https://raw.githubusercontent.com/Young4ever33/dsh-token-attention/f0f3e90b32f04655e0f5388baa603ec62b8cfe40/docs/screenshots/3-tasks.png" alt="Tasks" width="760">

**Cost** — peak split, cost leverage breakdown, and model comparison

<img src="https://raw.githubusercontent.com/Young4ever33/dsh-token-attention/f0f3e90b32f04655e0f5388baa603ec62b8cfe40/docs/screenshots/4-cost.png" alt="Cost" width="760">

**Settings** — pricing table, peak hours, and advice thresholds

<img src="https://raw.githubusercontent.com/Young4ever33/dsh-token-attention/f0f3e90b32f04655e0f5388baa603ec62b8cfe40/docs/screenshots/5-settings.png" alt="Settings" width="760">

## Install

Once published to npm:

```sh
dsh plugin --profile web add dsh-token-attention
```

Restart DSH, then open **Settings → 词元管理 (Token Check)**. Data is stored at `DSH_HOME/token-attention/token_records.db`.

### Development install (link)

```sh
npm install && npm run build
```

Then register the plugin in the web profile (`%APPDATA%\dsh-desktop\harness\profiles\web\package.json`):

```json
{
  "dependencies": { "dsh-token-attention": "link:/path/to/dsh-token-attention" },
  "dsh": { "profile": { "bundles": ["...", "dsh-token-attention"] } }
}
```

Run `pnpm install` inside `profiles\web`, restart DSH, and verify:

```sh
curl http://127.0.0.1:<port>/token-attention/api/health   # → {"ok":true,...}
```

## How it works

- **Collection**: the node half subscribes to DSH's `session/event` stream (usage, goal, subagent, compaction, turn) and writes normalized records to SQLite; a startup backfill replays existing sessions with an idempotent `last_seq` cursor.
- **Aggregation**: hourly incremental rollups into `daily_agg`, with a daily full rebuild for correction.
- **Official projection adapter (optional)**: when the base layer mounts `session-projection` + `token-meter` + `session-stats`, the session card reads context occupancy from `contextPressure.projectedTokens` (compaction-reactive, official capacity) and turn/step/LLM/tool/decode stats from `sessionStats` (same source as DSH's built-in stats bar); it falls back to its own computation when those units are absent — no extra dependencies.
- **Advice**: `src/shared/advice.ts` evaluates context occupancy, turns, hit rate, cost and model mix against your thresholds and suggests concrete actions.

## Configuration

Settings are editable in the panel and saved to SQLite:

| Setting | Default |
|---|---|
| Model pricing (¥ / million tokens, off-peak) | flash: hit 0.05 / miss 1.5 / output 4.5 |
| Peak hours (24h, start-inclusive) | 9–12, 14–18 |
| Context-occupancy advice threshold | 70% |
| Turn-count advice threshold | 40 |
| Hit-rate advice threshold | 40% |

## Development

```sh
npm run typecheck   # tsc --noEmit
npm run check       # node --check src/client/index.js
npm run build       # tsc → dist/
npm run selftest    # collection-layer self-test (idempotency / peak pricing / aggregation assertions)
npm pack            # build the publish tarball
```

## Uninstall

Uninstall in DSH Settings → Plugins, or remove the dependency and the bundles entry from the profile's `package.json`. The data directory `DSH_HOME\token-attention\` can be deleted manually; `dispose` cleans up timers and the SQLite connection.

## License

[MIT](LICENSE) © 2026 Young4ever33
