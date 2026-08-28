<p align="right"><a href="./README.zh-CN.md">简体中文</a></p>

# dsh-better-stats

A richer stats strip for the DeepSeek Harness (DSH) Web UI, sitting right below the composer: official CNY pricing (peak/off-peak tiers, auto-synced from the official pricing page), per-model accounting, live timers, subagent-tree merging, direct account balance, budget alerts, and streaming cost estimation.

```
DeepSeek Official | Balance ¥8.67 | Turn ¥0.1676 · Session ¥29.49 | 20 turns · 345 steps | LLM 1h 12m · Tool 5m 6s | TTFT avg 3.88s · 111.72tok/s | Cache 103.98M · hit 98.64% | In 1.44M · Out 336.53K
```

## Features

- **Balance**: host queries `api.deepseek.com/user/balance` directly (the `DEEPSEEK_API_KEY` credential goes through the DSH credentials seam, never the browser), 15s cache; **click the balance group to force a fresh query** (after switching models/API the balance would otherwise only update on the next poll; the host has a 2s anti-flood cooldown). The hover popover shows the **granted / topped-up split** (degrades to the total when fields are missing), a **days-left estimate** (EWMA-smoothed from today's spend and the trailing daily history), and a **recharge link** from the warn tier down.
- **Pricing**: official CNY price table ([api-docs.deepseek.com/zh-cn/quick_start/pricing](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)), re-synced by the host every 6h by mapping the official model-header columns, with a builtin fallback; the popover shows a "Prices" row with the source and fetch time (e.g. `DeepSeek Official 2026-08-18 14:16`). **Peak/off-peak tiers** (peak = Monday–Friday, Beijing 09:00–12:00 / 14:00–18:00, ×2 price; weekends are off-peak) apply per event timestamp; the strip shows the current tier and the popover the next switch with a countdown that skips weekends.
- **Per-model accounting**: each message is priced with the model that produced it (`deepseek-v4-flash` / `deepseek-v4-pro` / `deepseek-v4-flash-vision-exp` each use their official table). **Unknown models are explicit**: their tokens still total up but price at 0, the popover's Model group shows `Unpriced`, and the spend row notes the unpriced step count instead of silently pricing at a default.
- **Cache buckets**: uncached input, cache-read and cache-write are billed separately (cache-read at the much lower hit price), and the cache-hit rate is shown.
- **Turn**: the current turn is settled from the settled steps' event-level fold (each step priced at its own event time/model), plus a **streaming character-level estimate** for the in-flight step (densities self-calibrate via EMA from settled steps; priced at the current tier). The estimate × estAccuracy is ONE corrected value driving the amount, the Tok figures and the rate alike. The number grows continuously within the turn, keeps its final value after the turn ends, and resets only when the next turn starts.
- **Session / live Agent Team tree**: every second the host `/live` route publishes one coherent tree cut keyed by session id and event revision. Exact usage, CNY and model rows from the root, direct children and nested children reach the selected parent panel immediately; active children also contribute their streaming output estimate, turn/step, TTFT and tok/s without waiting for the 10s `/cost` baseline or requiring a browser binding for the child. A usage chunk replaces the estimate in place. `Turn` remains the selected session's current turn; `Session` accounting, usage and output represent the whole agent-team tree, while LLM/tool durations include only the selected session so parallel children cannot multiply elapsed time. Only `origin: subagent` joins the tree, ordinary forks remain separate, every session excludes its own `seedLength`, and a child transcript temporarily spliced into its parent is not counted twice.
- **Accounting contract**: `outputTokens` already includes `reasoningTokens` — reasoning is a display-only subset used for detail stats only, never billed twice, and the settled tok/s numerator is `sum(outputTokens)`; invalid samples count as invalid steps instead of being clamped. The initial model is `unknown` (never flash): unknown tokens still total and show as Unpriced; a legal `costCny: 0` is a real answer (absence is null/undefined); partial/stale snapshots mark the amount (`stale`/`partial`); model shares are priced-cost shares and token-share denominators include unknown. Prices come from a versioned ledger (`effectiveAt`); one immutable pricing snapshot serves the whole tree per request and caches are keyed by pricingVersion.
- **Budget alerts (optional, off by default)**: `config: { dailyBudgetCny: 20, monthlyBudgetCny: 100 }` — the spend group turns amber past 80% and red with ⚠ over budget; the popover shows `Today ¥x · daily budget ¥20 (85%)` / `Month ¥y · monthly budget ¥100 (30%)` (Asia/Shanghai midnight/month rollover).
- **Balance alerts (two tiers, default warn ≤¥20 amber / critical ≤¥5 red)**: the balance group changes color with ⚠ and the popover explains; `config: { balanceWarnCny, balanceCriticalCny }` adjusts the thresholds, `0` disables a tier.
- **Live timers**: the duration group shows LLM/tool time for the selected session only, so one wall-clock second stays one second even while several children run in parallel. Tool timing begins at that session's model tool-call decision, and its own parallel calls are accumulated separately. Whole-tree TTFT and tok/s remain live. The selected root keeps its rich `*-chunks` estimator and adaptive factor; invisible children send only a text-free token-fragment summary from the host (factor 1.01), replaced by exact provider usage at hand-off. An abnormal dispose freezes the host tree's durations and clears provisional output, and a provisional edge expires after five seconds without a fresh `/live` cut, so an interrupted child cannot tick forever.
- **Fresh-chat placeholder strip**: a new window/chat renders the full set of groups from the very first frame — empty values show as legal zeros or dashes (`0 turns · 0 steps`, `LLM - · Tool -`, `--`, `Cache 0 · hit 0.00%`, `In 0 · Out 0`, `Turn ¥0.0000 · Session ¥0.0000`) and are replaced in place once data arrives.
- **Live popover**: turn/session amounts, Tok and model rows, cache, activity counts, TTFT and tok/s update from the coherent tree while an agent team runs; LLM/tool duration stays scoped to the selected session. Per-model shares and the session accounting row use one denominator; usage/final/persistence transitions replace a per-session revision rather than add another copy.
- **Layout**: the strip matches the composer width, wraps to at most two rows, drops orphaned separators at row boundaries, and truncates overflowing content into a trailing `⋯` (measured from cached natural widths — no flicker, no feedback loop).
- **i18n**: UI strings follow the browser language (Simplified Chinese / English).
- **Precision rule**: computed amounts (turn/session/today) use 4 decimals, external amounts (balance) use the provider's own precision, configured amounts (budgets/alert thresholds) use 2, and the popover keeps 6-decimal detail.

## Install

### Option 1: npm (one command)

```sh
cd ~/.dsh/profiles/web
pnpm add dsh-better-stats
```

then register the package as a bundle (add `dsh-better-stats` to the `dsh.profile.bundles` array in the profile `package.json`), restart `dsh web` and hard-refresh the browser. The bundled `cordis.patch.yml` mounts the plugin row automatically — no manual YAML editing.

Defaults: two-tier balance alerts (warn ¥20 / critical ¥5), no daily/monthly budget. To customize, set any of `balanceWarnCny` / `balanceCriticalCny` (0 disables a tier), `dailyBudgetCny` / `monthlyBudgetCny` (presence enables) in the plugin's `config`.

### Option 2: GitHub clone

```sh
git clone https://github.com/null5069/dsh-better-stats.git
cd dsh-better-stats        # no runtime dependencies — no npm install needed
```

symlink the directory into the profile (`ln -s "$PWD" ~/.dsh/profiles/web/node_modules/dsh-better-stats`), add `"dsh-better-stats": "link:/absolute/path/dsh-better-stats"` to the profile `package.json` dependencies, then follow the bundle-registration + restart steps above.

## Architecture

| Half | File | What it does |
|---|---|---|
| Host | `lib/index.js` | `/balance`; per-root 10s `/cost` baselines; `/live` coherent root/subagent trees with usage, price, models, timers, text-free stream summaries and revision vectors; `/today`; official pricing sync every 6h |
| Client | `lib/client.js` | `conversation.composer.dock` strip; turn fold + streaming estimate; 1s `/live` polling; budget/peak countdown popover; two-row truncation with `⋯`; i18n (zh/en) |
| Tests | `test/` | Zero-dependency accounting, client UI, agent-team live-tree and lifecycle regressions, including `test/host-live-tree.test.mjs` |

Every route response carries `pricing: { source: "official"|"builtin"|"stale", fetchedAt, tables }` and an optional `budget`, so the client never hard-codes price numbers.

## Known boundaries

- The balance is the **whole DeepSeek account** (web chat, other programs and other machines sharing the key all deduct from it); stats cover only this workspace, and the balance endpoint itself has settlement lag — compare with long-window endpoints.
- Peak/off-peak is priced per event timestamp; peak applies only Monday–Friday at Beijing 09:00–12:00 / 14:00–18:00 and weekends stay off-peak. An official price change for the three supported models above is followed by the host within 6h using the header-column mapping, and the popover shows the price source meanwhile; other models remain explicitly unpriced until support is added.
- Live tool timing for the selected session starts at its model's tool-call decision; its own parallel calls accumulate separately, the last result replaces the open edge with settled time, and descendant tool time is excluded from the parent duration row.
- Streaming output is display-level provisional data. The selected root uses complete batch events and adaptive density; invisible subagents use host-visible token-delta fragments × 1.01 without sending text. Both are priced at the current output tier and replaced by exact usage.

## License

MIT
