# dsh-web-attention-badge

[English](README.md) | [简体中文](README.zh-CN.md)

<div align="center">

<img src="https://raw.githubusercontent.com/Luaphes/dsh-web-attention-badge/dc2265bf5c3962ad8c26b20073e3254e264d0e13/assets/demo.gif" alt="Browser tab strip: the whale favicon in the tab sits dark, tints amber (a session is waiting on you), then green (a session finished while you were away), with a (1) pending count in the tab title — session state readable without opening the page" width="686">

**One glance at the tab bar:** the whale favicon and the `(N)` title count track your sessions in real time — **amber = waiting on you, green = done**. No need to open the page.

</div>

---

<div align="center">

<img src="https://img.shields.io/badge/DSH-Curated%20Plugin-blue" alt="DSH Curated Plugin" title="Listed in the awesome-dsh-plugin curated DSH plugin list">
<a href="https://www.npmjs.com/package/dsh-web-attention-badge"><img src="https://img.shields.io/npm/v/dsh-web-attention-badge" alt="npm version"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://github.com/Luaphes/dsh-web-attention-badge/stargazers"><img src="https://img.shields.io/github/stars/Luaphes/dsh-web-attention-badge" alt="GitHub stars"></a>

</div>

**Watch the tab, not the terminal.** `dsh-web-attention-badge` is a one-line,
zero-install plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
WebUI. It turns the one place your eyes already land every few seconds — the
browser tab bar — into a live status light for your agent sessions.

## Why not just install a monitor app?

The "session dashboard" genre usually means: another install, a tray icon that
lives forever, a second window to open, a side channel to keep in sync.
**This is the opposite.**

- **Zero-install.** One command. No desktop app, no service, no tray icon, no
  background process. The whole thing is a hand-written client bundle that
  plugs into the official WebUI — close the tab and nothing runs.
- **No second screen.** Status lives where you already look: the tab bar.
  One glance and you know the state — *waiting on you* (amber) or *done*
  (green), even from a background tab.
- **No new transport.** The badge reads the WebUI's built-in sessions store —
  the same counts the UI itself uses. Zero host code, zero extra plumbing.
- **Zero config, click-through.** `pointer-events: none` — it never steals a
  click from the sidebar and never needs setup.

### Three surfaces, one glance

| Surface | 🟠 Amber | 🟢 Green |
| --- | --- | --- |
| Corner pill (top-left of the frame) | `(1)` — a session is waiting for your input | `(N)` — sessions finished while you were away, not yet opened |
| Browser tab title | `(1) DeepSeek Harness…` | `(N) DeepSeek Harness…` |
| Whale favicon (left edge of the tab) | tinted amber | tinted green |

- **Amber** = a session is blocked on *you*: an `ask_user` question, an
  approval prompt, or a plan-mode review.
- **Green** = a session finished while you were away and hasn't been opened
  yet.

The favicon sits at the left edge of the tab, so the reminder survives even
when the tab title is truncated.

> 💛 **If "one glance at the tab bar and I know the state" is a pain point you
> actually feel — leave a ⭐ Star. It genuinely means a lot to the author,
> and it helps the next person find this tool.**

## Install — 3 steps, under a minute

**1. Add the plugin.** One command; `dsh plugin` registers the bundle
automatically, no manual config:

```sh
dsh plugin --profile web add dsh-web-attention-badge
```

Prefer the source? Pin a tag straight from GitHub:

```sh
dsh plugin --profile web add "github:Luaphes/dsh-web-attention-badge#v0.3.2"
```

**2. Restart `dsh web`** and open the WebUI.

**3. Start a session, then look away.** Switch to another tab and glance at
the tab bar — pill, `(N)` title, and the recoloring whale tell you
everything. You're done.

Upgrade / uninstall:

```sh
dsh plugin --profile web update dsh-web-attention-badge
dsh plugin --profile web remove dsh-web-attention-badge
```

## Tuning

Constants at the top of `lib/client.js`:

- `TAB_TITLE_ENABLED` — the `(N)` browser tab-title prefix.
- `FAVICON_ENABLED` — the whale-favicon recolor.
- Pill colors/position — the `style` maps in `AttentionBadge` / `Pill`.

Bundle edits apply on a page refresh; manifest edits need a `dsh web`
restart.

## License

[MIT](LICENSE)

## ⭐ Support this tool

This little plugin was thrown together in a few hours during the early days
of DSH — no design doc, no dashboard, just "make the tab bar tell me what's
happening". If it cut your pain point, a ⭐ Star is the best thank-you:
**it matters to me, and it keeps a small tool visible.**

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for layout, release and publishing.
