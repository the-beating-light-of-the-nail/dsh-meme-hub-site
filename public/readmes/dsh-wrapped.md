# dsh-wrapped

[![CI](https://github.com/rand0wn/dsh-wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/rand0wn/dsh-wrapped/actions/workflows/ci.yml)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugin that turns a session into a shareable summary card — Spotify Wrapped, for your agent session.

## Why

Every session already has real, interesting numbers behind it — how much time went to reasoning versus tool calls, how fast the model streamed, how many turns it took — but they only ever show up as a small stats strip you glance at and forget. `dsh-wrapped` turns those numbers into a dark, screenshot-shaped card built for actually posting somewhere.

## Install

```bash
dsh plugin --profile <name> add dsh-wrapped
```

Add the package name to that profile's `dsh.profile.bundles` list (see
[dsh-minimal-anchor's README](https://github.com/rand0wn/dsh-minimal-anchor#install)
for why this second step is required — being a listed dependency alone
doesn't activate a plugin's `dsh.bundle` patch):

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-wrapped"
      ]
    }
  }
}
```

Confirm it composed with `dsh --profile <name> --dump-config` — look for a
`wrapped` entry.

## Usage

Type `/wrapped` in any session. It writes an SVG card to
`.dsh-wrapped/wrapped-<sessionId>-<timestamp>.svg` under the current working
directory and prints a plain-text summary alongside the file path. Open the
SVG in a browser and screenshot it, or convert it to PNG with any SVG tool.

Needs `@deepseek-ai/dsh-session-stats` mounted in the profile (it ships in
the `dsh-web-app` bundle by default) — without it, `/wrapped` returns a
clear error instead of a blank or wrong card.

## What's on the card

- Turn and step counts
- Tool time vs. thinking (LLM) time
- Average time to first token
- Decode speed (tokens/sec), omitted below a 1-second sample floor to avoid
  a noisy/misleading rate from too few tokens
- A one-line "type" verdict derived from the tool-time/thinking-time ratio:
  *The Explorer*, *The Deep Thinker*, or *The Balanced Operator*

## Configuration

```yaml
# profiles/<name>/cordis.patch.yml
- insert:
    - id: wrapped
      name: 'dsh-wrapped'
      config:
        minDecodeSampleMs: 1000
        verdictRatioThreshold: 1.5
```

| Field | Default | Description |
| --- | --- | --- |
| `minDecodeSampleMs` | `1000` | Below this much decode time, tokens/sec is shown as `—` instead of a number — too small a sample is noise, not a rate. |
| `verdictRatioThreshold` | `1.5` | How far tool-time and thinking-time must diverge (as a ratio) before the verdict picks *Explorer*/*Deep Thinker* rather than *Balanced Operator*. |

All of it comes from the session's own `sessionStats` projection — no
separate tracking, no extra token cost, nothing persisted beyond the SVG
file itself.

## How it works

Registers a `/wrapped` command via `@deepseek-ai/dsh-commands`. The handler
reads `ctx.sessionProjections.snapshot(invocation.agent.session)` for the
`sessionStats` key (turns, steps, `llmMs`, `toolMs`, `ttftMs`/`ttftSteps`,
`decodeMs`/`decodeTokens`), transforms it through a pure `buildCard()`
function into display rows and a verdict, then renders that to a
self-contained SVG string and writes it with plain `node:fs`. Commands never
enter model history and cost no tokens — this doesn't touch a single
request.

`buildCard` and `renderSvg` are pure functions with no dependency on a
booted `Context`, so the interesting logic (verdict thresholds, decode-speed
sample floor, XML escaping) is unit tested directly — see
[Development](#development).

Verified against a real local `dsh web` boot, not just types: installed
into a scratch profile, drove a real browser session with Playwright, ran
`/wrapped` after a real multi-tool-call turn, and confirmed the written SVG
file's numbers matched the session's own stats strip.

## Troubleshooting

**`/wrapped` returns "sessionStats projection is not available".** Your
profile doesn't have `@deepseek-ai/dsh-session-stats` mounted. It ships by
default in the `dsh-web-app` bundle; a custom or headless profile may need
it added explicitly. Check with `dsh --profile <name> --dump-config`.

**"This session has no completed steps yet."** `/wrapped` needs at least
one closed step (`step/end`) to have something to summarize — it can't
report on a session where nothing has happened.

**Can't find the SVG file.** It's written relative to the harness process's
current working directory, not your project directory or the harness
checkout — check the exact path in the command's success text, or look
under `.dsh-wrapped/` from wherever you launched `dsh`.

## Development

```bash
npm install
npm run typecheck
npm test
```

`buildCard`/`renderSvg` are plain functions with no `dsh` runtime
dependency — `examples/render-standalone.ts` renders a card from
hand-written stats, useful for iterating on the design without a live
session:

```bash
npx tsx examples/render-standalone.ts > card.svg
```

## License

MIT
