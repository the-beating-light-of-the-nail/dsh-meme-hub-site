# dsh-auto-compact

**English** | [**中文**](README.zh-CN.md)

[![License](https://img.shields.io/github/license/songoao25/dsh-auto-compact)](LICENSE)
[![Release](https://img.shields.io/github/v/release/songoao25/dsh-auto-compact)](https://github.com/songoao25/dsh-auto-compact/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/songoao25/dsh-auto-compact/ci.yml)](https://github.com/songoao25/dsh-auto-compact/actions)
[![Last Commit](https://img.shields.io/github/last-commit/songoao25/dsh-auto-compact)](https://github.com/songoao25/dsh-auto-compact/commits/main)
[![Stars](https://img.shields.io/github/stars/songoao25/dsh-auto-compact)](https://github.com/songoao25/dsh-auto-compact)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](https://github.com/songoao25/dsh-auto-compact/security/dependabot)

Enhanced auto-compaction defaults for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

DeepSeek Harness ships automatic context compaction (`dsh-compaction-basic`), but the default trigger threshold is 80% of the model's context window — too late for large-context models. This tool lowers the threshold to **75%** and adds per-route policies, so history is tidied up earlier and long sessions stay responsive.

## How it works

DeepSeek Harness runs one `compaction-basic` instance per **agent preset** (per session). Profile-level patches cannot reach that subtree, so this tool directly injects configuration into the `compaction-basic` entry of every user-installed preset under `~/.dsh/.agent-presets/`.

- Default: trigger at **75%** of the context window, keep the most recent **20%** verbatim.
- Per-route policies:
  - ChatGPT / Codex GPT-5.6 (272K context): trigger at **70%**.
  - OpenCode Go DeepSeek V4 (1M declared context): trigger at **65%**.
- Keeps the existing summarization, retry, and safe-fallback behavior of `dsh-compaction-basic` (a failed summary preserves the original history and never silently drops context).
- Manual `/compact` and tool-result pruning remain available.

## Installation

```bash
dsh plugin --profile <profile-name> add songoao25/dsh-auto-compact
```

Restart DeepSeek Harness once afterward. On bundle load, the plugin runs the
same safe injector described below: it changes only user-installed presets,
creates a timestamped backup before every change, skips a preset that already
has its own `compaction-basic` configuration, and is idempotent on later
starts. Roll back with:

```bash
./uninstall.sh
```

The uninstaller restores the latest backup for each affected preset. Run it
from a checkout of this repository; removing the DSH bundle alone does not
discard the preserved preset configuration.

### Important: Factory Presets

This tool **only injects into user-installed presets** under `~/.dsh/.agent-presets/`. The factory presets (`standard`, `code`, `cordis`, `minimal`) ship with their own default compaction settings (80% trigger, 16% retain) and are read-only — this tool will not modify them.

If you want enhanced compaction for a factory preset:

1. Copy it to your user presets directory:
   ```bash
   cp -r /opt/homebrew/lib/node_modules/@deepseek-ai/dsh/presets/<preset-name> ~/.dsh/.agent-presets/
   ```
2. Run `./install.sh` again to inject the enhanced configuration.
3. Select the copied preset in DSH's session setup.

## What the installer does

- Finds every `agent.cordis.yml` under `~/.dsh/.agent-presets/`.
- Injects the policy block into the `compaction-basic` entry of each preset.
- Backs up each modified file as `agent.cordis.yml.bak-auto-compact`.
- Idempotent: a marker comment prevents double injection.
- Skips presets that already configure `compaction-basic` themselves (merge manually in that case).
- Never touches the read-only factory presets in the DSH install directory.

## Configuration

All values live in `scripts/inject.mjs` (the `CONFIG_BLOCK`). Edit them before running `./install.sh` if you want different thresholds. Preview with:

```bash
node scripts/inject.mjs --dry-run
```

| Key | Default | Meaning |
|---|---|---|
| `thresholdRatio` | 0.75 | Trigger compaction when estimated usage reaches this fraction of the model context window |
| `retainRatio` | 0.20 | Keep the most recent fraction of the window verbatim |
| `modelPolicies` | – | Per `provider/model` overrides |

## Safety

- A failed summarization preserves the original history and logs a warning.
- Automatic recovery never loops indefinitely (bounded retries).
- The tool contains no secrets and no personal paths.
- Installation is fully reversible via `./uninstall.sh`.

## License

MIT © songoao25
