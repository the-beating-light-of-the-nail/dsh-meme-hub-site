# dsh-memories

[中文说明](README.zh.md)

**Dual-ledger cross-session memory for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).**

Inspired by the memory pipeline of OpenAI's open-source Codex agent, `dsh-memories` gives every new session in a project two living ledgers:

| Ledger | File | Answers |
|---|---|---|
| Long-term facts | `.dsh/memories/MEMORY.md` | "What are this project's conventions, the user's preferences, past pitfalls?" |
| Project progress | `.dsh/memories/PROGRESS.md` | "Where are we? What's done? What's in progress? What's next?" |

Both are maintained automatically and recalled into the system context of every new conversation — no re-briefing required.

## Features

- **Automatic extraction** — on each new session (throttled to once per 30 minutes), recent sessions from the same workspace (last 14 days, up to 2 per run) are summarized by an LLM into:
  - stable *facts* in four fixed categories: preference / project / environment / lesson
  - *progress* movements: completed / doing / next
- **Strict no-op gate** — one-off task details, code dumps, and secrets are never recorded; sessions with nothing worth keeping produce nothing.
- **LLM consolidation** — drafts are merged and rewritten into clean, deduplicated, sectioned ledgers (with automatic `.bak` backups).
- **Recall injection** — ledger contents ride along in the system prompt of every new session (inline when small, with a file pointer when large).
- **Decay** — consolidation drops stale entries (30 days unconfirmed) unless marked `pinned`.
- **Model tools & slash commands** — `remember` / `update_progress` tools let the agent write proactively; `/remember`, `/progress`, `/memories` give humans direct control.
- **Failure-safe** — LLM failures leave no trace in state; affected sessions are retried automatically next round.

## Requirements

A DeepSeek Harness deployment that provides the standard host-plane services:

`fs` · `llm` · `sessionQuery` · `systemPrompt` · `tools` · `commands` · `sandboxPolicy`

(all ship with the default `dsh-base` bundle; tested on dsh 0.1.0-rc.9)

## Install

### Option 0 — one line via `dsh plugin add` (recommended)

```bash
dsh plugin --profile web add dsh-memories
```

The plugin manager reads this repo's bundled `cordis.patch.yml) and wires everything for you. Needs a release that ships the bundle manifest -- the current npm 0.1.2 predates it, so until the next publish, use Option A.

### Option A — npm package into your profile

```bash
cd ~/.dsh/profiles/web            # or whichever profile you run
npm install <git-url-or-tarball>  # places dsh-memories into ./node_modules
```

Then append a row to `~/.dsh/profiles/web/cordis.patch.yml`. **Reference the entry file by relative path** — the proven pattern in pnpm-managed profiles (bare package names in patch rows are not reliably resolved):

```yaml
- insert:
    - id: dsh-memories
      name: './node_modules/dsh-memories/lib/index.js'
```

Alternatively, register it npm-natively: add `"dsh-memories": "*"` to the profile `package.json` `dependencies`, add `"dsh-memories"` to `dsh.profile.bundles`, run `pnpm install`, and skip the patch row entirely.

### Option B — copy the folder

Copy this repository folder into `~/.dsh/profiles/web/node_modules/dsh-memories`, then add the same patch row as above.

Restart DSH once. Done — the plugin loads at boot and works silently afterwards.

> If you previously ran this capability as a dynamic plugin (`cordis_define`/`mem-*`), remove it before restart to avoid duplicate tool registrations.

## Usage

You normally do nothing. For direct control:

| Command / Tool | Effect |
|---|---|
| `/remember <fact>` | Append a fact to the current project's ledger and trigger consolidation |
| `/memories` | Status: processed count, draft files, ledger previews, last error |
| `/memories rescan` | Force a fresh extraction pass now |
| `/memories reset` | Clear the "processed" registry so recent sessions get re-read |
| `/progress` | Show PROGRESS.md |
| `/progress <note>` | Append a progress note manually |
| model tool `remember(fact, category?, pinned?)` | The agent saves a durable fact mid-conversation |
| model tool `update_progress(completed?, doing?, next?)` | The agent updates the progress ledger at milestones |

### Where the data lives

```
<your-project>/.dsh/memories/
├── MEMORY.md          # consolidated long-term facts (4 sections)
├── MEMORY.md.bak      # previous version, kept on every rewrite
├── PROGRESS.md        # project progress (# 已完成 / ## 进行中 / ## 下一步)
├── PROGRESS.md.bak
└── raw/               # unconsolidated drafts (_manual.md, _progress.md, per-session notes)
```

Everything is plain Markdown — open it, edit it, diff it.

## How it works

```
new session ──▶ scan (same-workspace sessions, ≤14 days, ≤2/run)
                    │
                    ▼
            extract (one LLM call per session)
            ├─ facts[]      → raw/<session>.md
            └─ progress{}   → raw/_progress.md
                    │
                    ▼
            consolidate (one LLM call per ledger)
            ├─ MEMORY.md    ← merge + dedupe + decay(30d) + sections
            └─ PROGRESS.md  ← 已完成 / 进行中 / 下一步 + dates
                    │
                    ▼
next session ◀── recall section injected into system prompt
```

The extraction prompt enforces a strict schema (JSON array / NONE), caps entry length, forbids secrets, and skips trivial transcripts (<400 chars). Consolidation prompts enforce section formats and size budgets (≤100 lines for facts, ≤60 for progress).

## Limitations & roadmap

- **Project-scoped** — each workspace keeps its own ledgers. A global user-level ledger (like Codex's `~/.codex/memories`) is planned via a `globalDir` setting.
- Extraction reads only message text (no tool payloads).
- Progress consolidation is instructed — not guaranteed — to respect the 60-line budget.
- Chinese-oriented prompts today; English variants welcome via PR.

## License

MIT