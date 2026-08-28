# dsh-gap-feed

[English](README.md) | [中文](README.zh.md)

[![npm](https://img.shields.io/npm/v/dsh-gap-feed)](https://www.npmjs.com/package/dsh-gap-feed)
[![GitHub stars](https://img.shields.io/github/stars/faukwaa/dsh-gap-feed)](https://github.com/faukwaa/dsh-gap-feed)

A [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) plugin that posts a **hot-news or reminder card directly into the conversation stream** while the agent is thinking for a long time. Low-frequency, never intrusive.

![demo](https://raw.githubusercontent.com/faukwaa/dsh-gap-feed/754cb1d3bfa6282ecd40d308e9bdc7ef21dbbdf0/assets/demo.png)

## Features

- **In-stream injection** — when the agent thinks longer than a threshold, the plugin appends an `assistant/message` directly into the session log (`session.append` + `surfaceOp:'append'`), rendered as a card in the conversation stream with a clickable link. If a source fails, it silently degrades — never blocks the conversation.
- **Multiple sources** — today's hot news from Toutiao (公开 API, no login), trending GitHub repositories (created this week, sorted by stars), and Bilibili's hot ranking. Sources are fetched in parallel; one failing never affects the others.
- **In-chat reminders** — just say "remind me to have a meeting at 18:00" in the conversation; the model calls the `gap_feed_reminder_add` tool to save it. Due reminders are prioritized over news.
- **Settings page** — the dsh settings page renders the `gap-feed` form automatically from a schema: configure limits, manage reminders (CRUD / enable / done).
- **Rate limiting** — configurable thinking threshold + cooldown + per-hour cap, so it stays rare and never spams.
- **Priority** — due reminder > upcoming reminder > news; the same content is never injected twice.
- **Persistence-safe** — injected messages inherit a valid `model source` (kind/provider/model) from existing session messages, so the session loads fine after a restart (a forged source is rejected by SessionPersistence validation).

## Install

```bash
dsh plugin --profile web add dsh-gap-feed
```

Restart `dsh web` (or just refresh the page).

> Published on npm as [`dsh-gap-feed`](https://www.npmjs.com/package/dsh-gap-feed) — the market prefers prebuilt npm tarballs (no `allowBuilds` approval needed).

## Usage

### When does it inject?

All of the following must hold:

1. `enabled` is true;
2. the agent has been thinking for more than `minThinkSeconds` (default 20s) without idling — detected by polling the agent registry, so it's robust to event timing;
3. more than `cooldownMinutes` (default 15) since the last injection;
4. fewer than `maxPerHour` (default 4) injections in the last hour.

Otherwise it stays silent and does nothing.

### In-chat reminders

Say something with a time + a task, for example:

- "提醒我 18:00 开会" / "remind me to have a meeting at 18:00"
- "半小时后提醒我回邮件" / "remind me to reply to emails in half an hour"

The model parses it into `text` (the task) + `dueAt` (unix ms timestamp, default = now + 1h) and saves it. Parse failures return a friendly error without blocking the conversation. Due reminders are shown before news on the next injection.

### Settings

The dsh settings page automatically renders the `gap-feed` namespace form. Changes take effect immediately and survive restarts.

## Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Master switch |
| `minThinkSeconds` | number | `20` | Only inject after this many seconds of continuous thinking |
| `cooldownMinutes` | number | `15` | Minimum gap between injections (minutes) — the core rate limiter |
| `maxPerHour` | number | `4` | Per-hour injection cap (safety net) |
| `blacklist` | string[] | `[]` | Title blacklist words; a matching title is filtered out |

Defaults live in `DEFAULT_CONFIG` in `src/types.ts`.

## Reminder storage

```
$DSH_HOME/profiles/<profile>/data/gap-feed/reminders.json
```

- `DSH_HOME` defaults to `~/.dsh`;
- JSON array of `id / text / dueAt / done / enabled / createdAt`; missing dirs are created, and read/write failures or corrupt JSON silently fall back to in-memory state — never throws.

## Development

```bash
npm install        # dev deps
npm test           # vitest: 67 unit + contract tests
npm run typecheck  # tsc --noEmit
npm run build      # tsc -> dist/ (prepack runs it automatically)
```

Layering discipline: pure-function layers (`decision.ts`, `picker.ts`) have zero dsh dependency and full branch coverage; side-effect layers (`news.ts` network, `reminders.ts` file I/O) are mockable via the `Source` interface; the wiring layer (`index.ts`) only connects the runtime.

## Known limitations

- **Bilibili source** may be rate-limited (`-352`) on datacenter IPs; it degrades silently — other sources are unaffected.
- Reminder cards show via the same in-stream card; reminder UI is in the settings page.
- In-session dedup is per-plugin-lifetime (no cross-restart dedup).

## License

MIT
