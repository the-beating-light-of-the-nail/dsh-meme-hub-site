# dsh-on-iMessage

> Chat with your local DeepSeek Harness (dsh) agents from your iPhone, right inside the Messages app — no extra apps, no servers, no cloud.

[![GitHub stars](https://img.shields.io/github/stars/yuunnn/dsh-on-imessage?style=for-the-badge)](https://github.com/yuunnn/dsh-on-imessage)
[![GitHub release](https://img.shields.io/github/v/release/yuunnn/dsh-on-imessage?style=for-the-badge&label=release)](https://github.com/yuunnn/dsh-on-imessage/releases)
[![License](https://img.shields.io/badge/license-Apache--2.0-2f6f73?style=for-the-badge)](LICENSE)
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[![macOS](https://img.shields.io/badge/platform-macOS-111827?style=for-the-badge)](#)
[![iMessage](https://img.shields.io/badge/interface-iMessage-0d9488?style=for-the-badge)](#)
[![DeepSeek Harness](https://img.shields.io/badge/agent-DeepSeek%20Harness-7c3aed?style=for-the-badge)](#)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](#)

**中文版请阅读 [README.zh.md](README.zh.md).**

Turn your Mac into a 24/7 dsh companion that lives in your iMessage threads. Send a message to your bridge account and your local dsh agent picks it up, switches workspaces/sessions, runs tools, and replies back — all without opening a terminal.

## Why This Exists

- You already live in iMessage; dsh lives on your Mac.
- SSH from your phone is clunky. Web UIs need ports/VPNs. Telegram/WeChat need third-party platforms.
- iMessage is already on every iPhone, end-to-end encrypted, and works offline-first.

This bridge gives you a **real chat experience**: white bubbles from dsh, blue bubbles from you, one-to-one.

## Features

- **Chat with dsh from iMessage** — send any message, get the agent's reply.
- **Workspace switching** — `dsh`, `dsh use stockKing`, `dsh use 2`.
- **Session switching** — `dsh sessions stockKing`, `dsh use stockKing 0`.
- **New sessions** — `dsh new <message>`.
- **Web UI sync** — when dsh web is running, messages go through its local API so your browser stays in sync.
- **Safe by default** — strict sender whitelist; nobody else can trigger your agent.
- **Bilingual replies** — follows your Mac's language (or `DSH_BRIDGE_LANG=en|zh`).
- **Zero third-party services** — everything stays on your Mac and Apple's iMessage.

## Requirements

- macOS with Messages (iMessage) and a second Apple ID for the bridge account (recommended, avoids self-chat duplication).
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) installed (this is the `dsh` agent).
- Python 3.9+ (stdlib only for the bridge).

## Install

### Option A — as a dsh plugin (recommended)

This repo is a standard [DeepSeek Harness plugin bundle](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md), so it can be installed with one command:

```bash
dsh plugin --profile web add github:yuunnn/dsh-on-imessage
```

Then set the required environment variables in the shell that starts `dsh web`:

```bash
export DSH_BUDDY="+861234567890"             # your iPhone number
export DSH_AUTHORIZED_FROM="+861234567890"   # sender whitelist
export DSH_BRIDGE_ACCOUNT="E:dsh@icloud.com" # the second Apple ID signed into Messages
```

Restart `dsh web`. The plugin starts `bridge.py` automatically when the dsh profile boots.

> If pnpm asks to allow build scripts, add `dsh-on-imessage: true` to the profile's `pnpm-workspace.yaml` — this package has no build step, so this is usually not needed.

### Option B — standalone daemon

Paste this into your Mac terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/yuunnn/dsh-on-imessage/main/install.sh | bash
```

That's it. The installer clones this repo into `~/.dsh/bridges/imessage`, starts the daemon, and **prints the next steps, including signing in to a second Apple ID in Messages**.

> The installer only needs `git` and `python3`. Everything else is already on your Mac.


**DSH_BIN** (optional): if your dsh CLI is not on PATH and not in the npx cache, set the environment variable to its entry point, e.g. `export DSH_BIN="$HOME/deepseek-harness/apps/cli/lib/bin.js"`.

## Setup

1. **Create a second Apple ID** (e.g. `dsh@example.com`) at [appleid.apple.com](https://appleid.apple.com). This becomes the "dsh persona".
2. **Sign in to that account in Mac Messages** (Messages > Settings > iMessage).
3. **Set the bridge configuration**. The bridge reads these from the environment:
   - `DSH_BUDDY` = your iPhone number, e.g. `+861234567890`
   - `DSH_AUTHORIZED_FROM` = your iPhone number (or the email you reply from)
   - `DSH_BRIDGE_ACCOUNT` = the iMessage account the bridge listens on, e.g. `E:dsh@icloud.com`
4. **Restart the daemon**:
   ```bash
   pkill -f bridge.py; DSH_BUDDY="+861234567890" DSH_AUTHORIZED_FROM="+861234567890" DSH_BRIDGE_ACCOUNT="E:dsh@icloud.com" ~/.dsh/bridges/imessage/install.sh
   ```
5. **Text your bridge account** from your iPhone. It replies with `dsh` help.

## Usage

| Command | Meaning |
|---|---|
| `dsh` | List workspaces |
| `dsh use <id\|path\|name>` | Switch workspace (latest session) |
| `dsh use <id\|path\|name> <session#>` | Switch workspace + specific session |
| `dsh sessions [<workspace>]` | List sessions |
| `dsh new <message>` | Start a new session |
| anything else | Continue the current session |

Workspaces are matched by index, full path, or basename — exact match wins, ambiguous matches list candidates.

## Architecture

```
iPhone iMessage
   │  (send to dsh@icloud.com)
   ▼
Mac Messages (chat.db + osascript)
   │
   ▼
bridge.py (poll new messages)
   │
   ├── dsh web API (127.0.0.1:3080)  ──► dsh web UI stays in sync
   └── dsh --profile headless --resume (fallback)
   │
   ▼
reply via Messages back to iPhone
```

## Security

- **Sender whitelist**: only `AUTHORIZED_FROM` handles are processed.
- **Account isolation**: only messages addressed to the bridge account are processed.
- **Local-only**: no public servers, no telemetry, no cloud.
- You can keep using iMessage for personal memos; those go to a different thread and are ignored.

## FAQ

**Why a second Apple ID?** iMessage treats messages between addresses of the same Apple ID as self-chat, which duplicates bubbles. A separate Apple ID gives a clean one-to-one conversation.

**Do I need the dsh web UI running?** No. The bridge falls back to the headless CLI if the web process is not listening.

**Can other people trigger it?** No. Only your whitelisted handle(s) can.

## License

Apache-2.0. See [LICENSE](LICENSE).
