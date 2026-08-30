# dsh-backstory

[![CI](https://github.com/MeghanBao/dsh-backstory/actions/workflows/ci.yml/badge.svg)](https://github.com/MeghanBao/dsh-backstory/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![dsh plugin](https://img.shields.io/badge/dsh-plugin-6f42c1.svg)](https://github.com/deepseek-ai/deepseek-harness)

**English** · [中文](README.zh.md)

> Ask any line of code its **backstory** — *what it does*, and *why it's here*.

![dsh-backstory demo — each line traced to the commit that explains why it's here](https://raw.githubusercontent.com/MeghanBao/dsh-backstory/280c0d758c0294f53f2c156c26978dc0a47d126c/demo.gif)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugin.
`git blame` tells you *who* wrote a line and *when*. `dsh-backstory` adds the part
that actually matters when you're staring at unfamiliar code: **what it does and
why it exists** — grounded in the commit that last touched it *and* in the agent's
own history: **which turn wrote each line, and the prompt that triggered it.**

```
backstory  src/blame.ts:27
──────────────────────────────────────────────────────────────
L27 · a5d49e9  2026-08-20 — "feat: dsh-backstory v0.1 …"
    const header = /^([0-9a-f]{40}) \d+ (\d+)(?: \d+)?$/.exec(raw)

→ WHAT: matches a `git blame --line-porcelain` header line (sha + line numbers)
→ WHY : commit "dsh-backstory v0.1" — starts a new blame record for each line
```

## Why it's different

- `git blame` → *who / when / which commit*.
- **`dsh-backstory`** → *what the line does* + *why it's here*, in one place.
- Not a generic "explain this code" (any LLM does that). The **why** comes from
  real repository history, so the answer is grounded, not guessed.
- When the **agent itself** wrote a line, it adds a dsh-native `origin` that
  `git blame` can never give you — *which turn wrote it, and your prompt* —
  per line (`🧬t14`) and for the file:

  ```
  L1 · a5d49e9 … 🧬t14
      export const greeting_de = "Willkommen"
  🧬 origin · turn 14 — you asked: "支持德语双语" [ledger-hash]
  ```

## Provenance: three layers

Each queried line is attributed by whichever source is most precise, in order:

1. **Ledger content-hash** (`[ledger-hash]`) — every write/edit is recorded to a
   repo-committed `.dsh/backstory.jsonl` with the touched lines' content hashes.
   A line is matched by its **text**, so it survives moving up/down the file
   (line-number drift). This persists across sessions, machines, and people.
2. **Commit trailer** (`[commit]`) — once work is committed with `DSH-Turn` /
   `DSH-Prompt` trailers, `git blame → sha → trailer` recovers the provenance and
   **git's own line tracking handles drift for free**.
3. **Live session log** (`[session]`) — for the current session before anything
   is written to the ledger, reconstructed from `exec.agent.session.events`.

All three degrade gracefully: no ledger, no trailers, no git — you still get the
source lines back.

## Install

Two ways to run the same engine.

### As an MCP server — any MCP client (Claude Code, Cursor, …)

No DeepSeek Harness required. Point your client at the `backstory-mcp` binary,
which speaks the Model Context Protocol over stdio and exposes the `backstory`
and `backstory_remember` tools. For Claude Code:

```sh
claude mcp add backstory -- npx -y dsh-backstory
```

Or wire it into any client's MCP config directly:

```json
{
  "mcpServers": {
    "backstory": { "command": "npx", "args": ["-y", "dsh-backstory"] }
  }
}
```

Run it from the repo whose history you want to query — the server reads git and
the `.dsh/` ledger relative to its working directory. The standalone server uses
the git-native provenance (commit trailers + the committed ledger); the live
per-turn session origin is exclusive to the dsh plugin below.

### As a DeepSeek Harness plugin

```sh
dsh plugin add dsh-backstory
```

The dsh host applies the bundle patch declared in `package.json`
(`dsh.bundle.patch` → [`cordis.patch.yml`](cordis.patch.yml)), which inserts the
plugin into the running composition. No extra wiring needed.

### From source (local development)

```sh
git clone https://github.com/MeghanBao/dsh-backstory.git
cd dsh-backstory
npm install
npm run typecheck   # tsc --noEmit
npm test            # blame parser, provenance engine, git-blame e2e
npm run build       # emit the MCP server to dist/ (backstory-mcp bin)
npm run mcp         # run the MCP server over stdio from source
```

The standalone [`cordis.yml`](cordis.yml) loads just the dsh plugin for local
iteration.

## Usage

Type the **`/backstory`** command, optionally with a file and line range:

```
/backstory src/auth.ts:40-60
/backstory utils/date.ts
```

Or just ask the agent in natural language (it uses the same `backstory` tool):

- *"what's the backstory of `src/auth.ts` line 88?"*
- *"explain `utils/date.ts` lines 10–40 and why each part is there"*

The tool returns each line with the commit that last touched it (author, date,
message) and — when known — the agent turn/prompt that wrote it (`🧬t<turn>`).
The agent narrates *what* the code does and uses the commit message + origin for
*why*. Outside a git repo it degrades gracefully to source-only.

### Tool: `backstory`

| Param | Type | Notes |
|-------|------|-------|
| `path` | string (required) | absolute or workspace-relative |
| `line` | number | first line (1-based); omit for the whole file |
| `endLine` | number | last line; defaults to `line` |

Whole-file reads are bounded to 400 lines.

### The ledger & commit trailers

The plugin records every `write`/`edit` to `.dsh/backstory.jsonl` automatically
(via a `tools/post-execute` observer) — **commit that file** to make provenance
travel with the repo.

To also anchor provenance in git history (drift handled by git), install the
`prepare-commit-msg` hook once per clone:

```sh
npm run install-hook
```

From then on every commit gets the newest ledger record for its staged files
folded into trailers automatically:

```
DSH-Turn: 14
DSH-Prompt: 支持德语双语
DSH-Session: 0f3a…
```

The hook is best-effort (never blocks a commit), idempotent (safe on `--amend`),
and self-disabling if removed. It backs up any existing hook to `*.backup`.

### Incremental explanations

Explaining a line costs a model call, so explanations are cached. After the agent
explains the `unexplained` lines from a `backstory` result, it calls
`backstory_remember` to store them — keyed by each line's **content hash**, in
`.dsh/backstory-notes.jsonl`. Next time, unchanged lines come back with their
`explanation` already attached (`↳`), and only lines whose text changed need
re-explaining. Cheap, and never stale.

### Privacy: redaction & opt-out

Prompts are stored in the ledger (and, via the hook, in commit trailers), so
common secrets are **scrubbed automatically** before they are written — OpenAI /
GitHub / AWS / Slack / Google keys, JWTs, `Bearer` tokens, and `key=value` pairs
for `password` / `token` / `secret` / `api_key` become `[REDACTED]`.

Turn recording off, or add your own patterns, via `.dsh/backstory.config.json`:

```json
{ "record": true, "redactPatterns": ["ACME-\\d+"] }
```

Or disable it everywhere with an env var: `DSH_BACKSTORY_DISABLE=1`.

> ⚠️ Redaction is best-effort pattern matching, not a guarantee — review commits
> before pushing, and opt out for anything sensitive.

## Roadmap

- **v0.1** — git-history backstory: line → commit → what/why. ✅
- **v0.2** — dsh-native half: reconstruct which agent turn wrote a file and the
  prompt that triggered it, from the live session log (file-level). ✅
- **v0.3a** — **persistent line-level ledger**: record every write/edit to
  `.dsh/backstory.jsonl` (turn, prompt, touched lines, content hashes); survives
  across sessions/machines/people. ✅
- **v0.3b** — **drift-proof attribution**: match a line by its content hash, so
  provenance survives the line moving in the file. ✅
- **v0.4** — **git-native provenance**: `DSH-*` commit trailers, recovered via
  `git blame → sha → trailer`, with drift handled by git itself; plus a
  `prepare-commit-msg` hook installer (`npm run install-hook`) that folds ledger
  records into trailers automatically. ✅
- **v0.5** — **privacy**: automatic secret redaction in stored prompts + a
  `.dsh/backstory.config.json` / `DSH_BACKSTORY_DISABLE` opt-out. ✅
- **v0.6** — a **`/backstory` user command** (registered as a dsh skill) that
  drives the tool with a file:line argument. ✅
- **v0.7** — **incremental explanations**: cache per-line explanations by content
  hash (`backstory_remember` → `.dsh/backstory-notes.jsonl`); only re-explain
  lines that changed. ✅
- **v0.8** — **standalone MCP server** (`backstory-mcp`): the same engine over the
  Model Context Protocol, so any MCP client (Claude Code, Cursor, …) gets the
  `backstory` / `backstory_remember` tools with no dsh required. Reuses the
  git-native core; compiled to `dist/` and published to npm. ✅

## Status

Built against the `dsh` developer preview — APIs may shift. The blame parser,
provenance engine, ledger, hash attribution, git-blame and commit-trailer paths
are covered by **43 tests** (pure logic + e2e against real temp repos). Every
runtime touchpoint (`exec.agent.session.events`, the `tools/post-execute`
recorder) is defensive and degrades gracefully, so the tool never breaks.

## License

[MIT](LICENSE) © Meghan Bao
