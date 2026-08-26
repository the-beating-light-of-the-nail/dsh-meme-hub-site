# 🧹 dsh-housekeeper — Environment Housekeeper

[中文说明](README.zh.md) · [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin

Keep your agent's hands clean: **toolchain inventory, two-step cache cleanup, and machine rules (AGENTS.md) editing** — all inside the DSH Web GUI settings. Zero runtime dependencies, one command install.

- 📋 **Toolchain inventory** — auto-detects node/pnpm/git/gh/ffmpeg/Edge/Chrome locations and versions
- 🗑️ **Honest cache cleanup** — scans the `.tmp` and cache directories agents leave behind: size / file count / mtime, 4000-file truncation markers, 30-day-untouched highlighting, click-to-expand content preview; create a plan, then confirm deletion
- 🛡️ **Whitelist protection** — only project `.tmp` dirs and cache-root children are deletable; `..` escapes, symlink escapes, and system paths are rejected, with a realpath re-check before every delete
- 📝 **Machine rules editor with a safety net** — read/write `~/.dsh/AGENTS.md` (the global rules every agent session loads), **auto-backup of the previous version on every save**, one-click restore, live on save
- 🌍 **Configurable** — scan roots default per platform (Windows: `D:\github` / `D:\environment\cache`), editable in the panel, overridable via env vars
- 🤖 **Agent tools** — `housekeeper_report` (inventory + disk report), `housekeeper_plan` (review only), and `housekeeper_clean` (executes a single-use token)

## Install — copy, paste, confirm

```sh
# Install from GitHub — this is the supported release channel.
dsh plugin --profile web add github:guo6x/dsh-housekeeper
```

Restart a running `dsh web` process, then open **Settings → Plugins → 环境管家**. **Seeing the Toolchain inventory section means installation is complete.**

Requirements: the DSH web profile and Node ≥ 22. The plugin needs no account, API key, or extra service.

Developing from a checkout instead? Run `dsh plugin --profile web add .` from the repository directory. The committed `lib/` files mean GitHub installs do not run a build script.

## First safe pass in 60 seconds

**Nothing in this walkthrough deletes files or writes rules.**

1. Open **Settings → Plugins → 环境管家**.
2. Inspect the detected toolchain and cache candidates; click a row to preview its contents.
3. Do not select anything yet. You have verified the inventory and the candidate list without changing the machine.

For the same non-destructive proof through chat, paste:

> Run `housekeeper_report` and summarize the detected toolchain plus the largest cache candidates. Do **not** create a cleanup plan, delete files, or change machine rules.

When you are ready to clean, select only scratch directories you recognize and choose **Generate cleanup plan**. Read the approved and rejected paths; deletion remains impossible until you explicitly use that plan’s one-time confirmation action.

The same reviewed flow is available to an agent: ask for `housekeeper_report`, review `housekeeper_plan`, and only then allow the returned token to reach `housekeeper_clean`.

### If the panel is missing

- Confirm the plugin is installed in the **web** profile: `dsh plugin --profile web list dsh-housekeeper`.
- Restart the `dsh web` process after installing; a browser refresh alone cannot load new host code.
- Check that Node is version 22 or newer. The inventory can run without Edge, Chrome, or any cloud credential.

## Security model

- All routes accept loopback clients only (403 otherwise)
- **Cleanup whitelist** — a path is deletable only when ALL hold:
  - under `<projects-root>\<repo>\ .tmp\`, or a direct child of `<cache-root>\`
  - normalized path stays inside the whitelist root (no `..`)
  - `realpath` still lands inside the whitelist root (no symlink escapes)
  - the whitelist roots and repo dirs themselves are never deletable
- **Two-step confirmation** — a cleanup plan exists only in memory; its confirmation token expires after five minutes, is single-use, and every path is checked against the whitelist and `realpath` again immediately before deletion
- The rules endpoint reads/writes `$DSH_HOME/AGENTS.md` only; the path is fixed
- No telemetry, no external network calls

## How it works

```
GUI settings ──fetch──▶ /housekeeper/state|clean/plan→clean|rules (loopback) ──▶ host plugin
                          ├─ probe: candidate paths + PATH lookup + versions
                          ├─ scan: rule-driven walk with sizes (4000-file cap)
                          ├─ clean: whitelist + realpath → plan → single-use confirmation → re-check, then rm
                          └─ rules: read/write $DSH_HOME/AGENTS.md (64KB cap)
```

## Develop

```sh
pnpm install
pnpm test              # build, safety regression suite, and release-package check
```

MIT licensed. Issues and ideas welcome.
