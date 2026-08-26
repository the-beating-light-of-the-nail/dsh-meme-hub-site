# dsh-peak-cost-mode

DeepSeek peak-pricing cost guard for [DeepSeek Harness](https://github.com/deepseek-ai/dsh) (DSH): during DeepSeek peak-pricing hours (Mon–Fri Beijing time 09:00–12:00 and 14:00–18:00, price ×2; weekends are always valley) the agent automatically switches to ultra-compressed **caveman-style output** to cut output tokens, and a header badge + toast keep you posted on every peak/valley transition.

## Features

- **Automatic peak detection** — Beijing time (UTC+8, no DST) is checked every 30 s against the DeepSeek V4 peak-pricing schedule:
  | Window (Beijing) | Tier | Price |
  |---|---|---|
  | Mon–Fri 09:00–12:00 | Peak | ×2 |
  | Mon–Fri 12:00–14:00 | Valley | ×1 |
  | Mon–Fri 14:00–18:00 | Peak | ×2 |
  | Mon–Fri 18:00–next 09:00 | Valley | ×1 |
  | **Sat & Sun (all day)** | **Valley (weekend)** | **×1** |
- **Peak-hour cost saving** — while in a peak window, a "Peak Cost Mode" prompt section is injected, instructing the model to reply in ultra-compressed caveman style (drop filler/pleasantries/hedging, keep all technical content verbatim: code, commands, API names, file paths, exact error strings, numbers; safety warnings and irreversible-action confirmations are never compressed).
- **Transition reminders** — toasts on every tier switch:
  - valley → peak: 「梁文锋来了，少说话多做事。」(Liang Wenfeng is here — talk less, do more.)
  - peak → valley: 「梁文谷来了，一切正常。」(back to normal)
- **Persistent status badge** — right side of the session header (left of the session-log button): red `高峰 ×2 · 省流中` during peak, green `🟢 低谷 · 主动省流中` while voluntary saving, green `低谷 ×1` otherwise, with full details (windows / multiplier / Beijing time / next switch) on hover. Clicking the badge opens the savings report.
- **Voluntary saving in valley hours (0.3.0)** — click the green badge during a valley window to open the report, then hit **「🟢 我要省钱！」** (I want to save!) in the bottom-right corner: the same caveman prompt section is injected and metering continues, with waves tagged `source: voluntary` kept separate from official-peak waves (`source: peak`). The badge stays green (with 🟢 to distinguish “voluntary saving”), and the report splits today/total into “peak saved / voluntary saved”. The switch is persistent across restarts and peak windows: entering a peak auto-merges into peak metering, leaving a peak auto-resumes voluntary saving, and you can stop it anytime via **「✋ 停止省流」** in the report.
- **Savings metering (0.3.0)** — during any saving mode the plugin intercepts every streaming model call (`llm/stream`) and records real token usage per model (input miss / cache hit / output, disjoint counts from the DeepSeek adapter). It then estimates how much the cave-man compression saved you and converts it to RMB at the DeepSeek peak output price:
  - `saved tokens ≈ actual output tokens × r/(1−r)` where **r = compression ratio, default 0.6** (conservative; configurable 0–0.9).
  - `saved RMB = saved tokens × model peak output price / 1M` (peak price = valley ×2; e.g. V4-Flash output ¥9.0/M, V4-Pro output ¥27.0/M).
  - **Output side only** — the compression never changes input tokens or cache hits (the platform's prompt-reuse cache rate is independent of the plugin), so only the output side counts as money saved. The input-side `cache delta` (baseline vs. actual hit rate) is exposed in `/stats` as reference info only, never added to the savings.
  - The report shows the honest counterfactual: estimated output without the plugin → actual output → tokens and RMB saved, plus a per-model breakdown. Totals are persisted per wave to `${DSH_HOME:-~/.dsh}/dsh-peak-cost-mode/stats.json` (v3) and survive restarts.
  - Good to know: the “saved” figure is an **estimate** (a counterfactual — the exact uncompressed output is unknowable). It is clearly labelled as such in the UI.
- **Where savings are shown** — the header badge (live counter), an ambient readout above the composer (`conversation.composer.dock`), toasts on peak/voluntary transitions, and a **savings report panel** (click the badge): current wave / today / total in tokens + RMB, per-model breakdown (counterfactual output → actual output → saved), peak-vs-voluntary split, and reset (`POST /api/peak-cost/reset`).

## Install

```sh
dsh plugin --profile web add dsh-peak-cost-mode
# or from GitHub
dsh plugin --profile web add github:moon09300731/dsh-peak-cost-mode
```

Then restart `dsh web` and hard-refresh the browser page.

## Configuration

Optional JSON file at `${DSH_HOME:-~/.dsh}/dsh-peak-cost-mode/config.json`:

```json
{
  "saveRatio": 0.6,
  "baseCacheHitRate": 0.5,
  "multiplier": 2,
  "peakWindows": [
    { "start": 9, "end": 12 },
    { "start": 14, "end": 18 }
  ],
  "weekendValley": true,
  "prices": {
    "deepseek-v4-flash": { "hit": 0.05, "miss": 1.5, "output": 4.5 },
    "deepseek-v4-pro": { "hit": 0.15, "miss": 4.5, "output": 13.5 }
  }
}
```

- `saveRatio` — assumed output-compression ratio of the cave-man mode (default 0.6; bounds 0–0.9).
- `baseCacheHitRate` — assumed input cache-hit rate for the “without plugin” counterfactual input invoice when no valley-time measurement exists (default 0.5).
- `peakWindows` — array of Beijing-hour peak windows, each `{start, end}` (default `[{9,12},{14,18}]`).
- `weekendValley` — `true` (default) means Sat/Sun are always valley/off-peak; set `false` to restore the old weekend-peak behavior.
- `multiplier` — peak multiplier used for the RMB conversion (default 2).
- `prices` — per-model valley prices in ¥ per million tokens; exact model keys override the built-in flash/pro defaults. **Prices go stale — verify against the official DeepSeek pricing page; displayed savings are estimates, not an invoice.**

## How it works

- Host (`src/index.mjs`): a 10 s timer computes the Beijing wall-clock time and drives a three-state machine (`peak` / `voluntary` / `none`). Any saving state registers a `systemPrompt` section (`peak-cost-mode`, order 60) that makes model steps reply in compressed caveman style; leaving the state disposes the section. It subscribes to the `llm/stream` waterfall, wrapping each call to capture `usage` (input/cacheRead/output tokens) + model id on clean completion, and books it into the open saving wave (tagged `source: peak` or `source: voluntary`). Exposes `GET /api/peak-cost/state`, `GET /api/peak-cost/stats`, `POST /api/peak-cost/voluntary?active=true|false` (persistent voluntary switch) and `POST /api/peak-cost/reset`.
- Client (`client.js`): polls `/api/peak-cost/state` every 10 s (mirroring a snapshot to `localStorage` key `dsh.peakCost.v1`) and renders the badge, toasts, the composer readout and the report panel (with the「我要省钱！」/「停止省流」buttons in the bottom-right corner).

> Note: the prompt section is registered in the host scope, so during any saving mode it applies to **all sessions** of the deployment (that is the cost-saving point). If you want per-session compression only, use the dynamic-plugin variant instead.

## Development

```sh
npm test                       # node --check src/index.mjs && node --check client.js && unit tests
node scripts/verify.mjs        # independent recompute of /api/peak-cost/stats (all-PASS = correct accounting)
```

## License

MIT © moon09300731
