# dsh-i-have-adhd

ADHD-friendly output shaping for [DeepSeek Harness (DSH)](https://github.com/search?q=deepseek+harness): one system-prompt section that rewrites how the assistant replies — action first, numbered steps, concrete time estimates, zero preamble or closers — with live on/off switches that persist across restarts.

[中文说明](./README.zh.md)

Inspired by [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (MIT). The ruleset here is an original rewrite for DSH; see [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

## What changes

| Before | After |
| --- | --- |
| "Great question! Let me think about this. Your auth flow has a few moving pieces: the middleware, the token verification, and... Hope this helps!" | "Run `npm install jsonwebtoken@latest`, then edit `src/auth.ts:42`. 1. Open the file 2. Replace `verifyToken` 3. Run the tests. Next: paste the first failing line." |

## How it works

- One system-prompt section (`dsh-i-have-adhd`, order 50 — after the persona, before tool guidance) carries the ruleset into every model step while the mode is on.
- Three zero-argument agent tools control it:
  - `adhd_on` — enable for this session and persist (flag file under `$DSH_HOME/dsh-i-have-adhd/`)
  - `adhd_off` — disable and clear the flag
  - `adhd_status` — report state, since when, and whether restart will restore it
- The persisted flag restores the mode at boot.
- The section registers through the systemPrompt service, so toggling takes effect on the very next model step — no session restart, no page refresh.

## Usage

Install, then just say it in conversation:

```text
adhd mode on      → the model calls adhd_on; replies switch shape immediately
adhd mode off     → back to default style, flag cleared
```

You can also ask for status any time, or create/remove the flag file yourself:
`$DSH_HOME/dsh-i-have-adhd/always-on` (default `~/.dsh/dsh-i-have-adhd/always-on`).

## The ruleset

Ten ideas, grouped for skimming — full text in [`dsh/rules.js`](./dsh/rules.js):

**Shape**: first line is the action · number the steps · close with one next move · park side quests
**State**: re-say where we are · estimate in real units · surface what now works
**Tone**: errors are facts · cap lists at five · no throat-clearing

Explicit overrides: harness rules outrank the mode; "explain" gets full depth with the same shape; destructive actions still confirm; a three-turn debug spiral triggers one diagnostic question instead of more edits.

## How this differs from other ADHD plugins

Two ADHD-related plugins already exist on the market, doing different jobs:
[dsh-adhd-copilot](https://github.com/zimai233/dsh-adhd-copilot) coaches the user (task breakdown, launch rituals); [adhdgofly-dsh-ext](https://github.com/zuoguyoupan2023/adhdgofly-dsh-ext) highlights parts of speech in rendered Markdown. Neither touches how the assistant writes. This plugin shapes the assistant's own replies — action-first structure, live on/off, restart persistence.

## Install

```sh
dsh plugin --profile <your-profile> add dsh-i-have-adhd
```

## License

MIT. Third-party notices: the concept and name derive from ayghri/i-have-adhd (MIT), whose license text is preserved in [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
