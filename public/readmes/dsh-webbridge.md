# dsh-webbridge — Model tools that drive your REAL browser via Kimi WebBridge

[![Release v0.0.3](https://img.shields.io/badge/release-v0.0.3-5B4CF0?style=flat-square)](https://github.com/omdsh-dev/dsh-webbridge/releases/tag/v0.0.3)
[![License: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-0B7285?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%5E20%20%7C%20%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![DSH profiles](https://img.shields.io/badge/DSH-Web-5B4CF0?style=flat-square)](cordis.patch.yml)

**Install:** `dsh plugin --profile web add github:omdsh-dev/dsh-webbridge`

**A DeepSeek Harness host plugin: it bridges Kimi WebBridge's local daemon into eleven `webbridge_*` model tools, so the model operates **your own browser** — logins, cookies, and already-open tabs included — instead of a headless one.**

[English](README.md) | [中文](README.zh.md)

## Why this exists

When a model task has to touch a real website — a page behind your login, carrying your session and your already-open tabs — a headless browser cannot help: it holds none of your state and would ask you to authenticate all over again. `dsh-webbridge` exists to hand the model control of **your real browser** while keeping that browser state strictly on your machine, never inside a model request.

It ships **no browser-driving code of its own**: the actual work is done by the Kimi WebBridge daemon and browser extension. This plugin only translates that capability into model-facing tools on the DSH side.

## Features

- **Real browser, not headless**: logins, cookies, and live sessions preserved
- **Eleven model tools**: navigate / find_tab / snapshot / click / fill /
  evaluate / screenshot / list_tabs / network / close_tab / close_session
- **One task = one tab group**: a `session` name groups tabs, keeping tasks
  cleanly isolated
- **Local-first**: the daemon runs on your machine; browser state never leaves it
- **No KV-cache burden**: browser state lives outside the model request

## Usage

### Prerequisites (required!)

This plugin is an adapter — **without the pieces below, browser control does
not work**. You must install Kimi WebBridge separately (an independent product
by Moonshot AI; this plugin contains none of its code). Full install and
browser-extension setup instructions live on Kimi's official pages:
[feature page](https://www.kimi.com/features/webbridge) /
[help center](https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-introduction).
In short:

```bash
# 1. Install the daemon:
curl -fsSL https://cdn.kimi.com/webbridge/install.sh | bash

# 2. Install the Kimi WebBridge browser extension and let it connect to the
#    daemon (search "Kimi WebBridge" in the Chrome Web Store), then check:
kimi-webbridge status   # expect "extension_connected": true
```

If the daemon is not running, tools fail loud with a `daemon_unreachable`
error that tells you to run `~/.kimi-webbridge/bin/kimi-webbridge start`.

### Model experience

| Tool | Purpose |
|------|---------|
| `webbridge_navigate` | Open a URL (new tab or current), set the tab group label |
| `webbridge_find_tab` | Re-select a tab this task opened, or borrow the user's active tab |
| `webbridge_snapshot` | Read the page's accessibility tree (text + `@e` refs) |
| `webbridge_click` | Click an element by `@e` ref or CSS selector |
| `webbridge_fill` | Type into inputs / textareas / contenteditable editors |
| `webbridge_evaluate` | Run JS in the page (async supported) |
| `webbridge_screenshot` | Capture the page or one element to a file path |
| `webbridge_list_tabs` | List the tabs opened in the session |
| `webbridge_network` | Inspect network activity (start/stop/list/detail) |
| `webbridge_close_tab` | Close the current tab of the session |
| `webbridge_close_session` | Close ALL tabs of the session (clears the tab group) |

### Session and closing rules (model contract)

These rules come from the upstream Kimi WebBridge skill and are part of the
model contract:

- **One task = one session = one tab group.** Pick a `session` name at the
  task's start and keep it on EVERY call — never switch mid-task.
- **Name it after the task**, not the site (`camping-research`, not
  `kimi.com`).
- **`group_title`** is the human-readable group label, set on the FIRST
  `navigate` of the task, written in the user's language.
- **Closing is always user-initiated.** Call `webbridge_close_session` ONLY
  when the user explicitly asks to close/clear the tabs; never close tabs
  automatically at the end of a task.

### Configuration

The daemon address defaults to `http://127.0.0.1:10086`. The plugin accepts
no configuration today; the `baseUrl` seam exists for tests.

## Install

The plugin is a DSH **bundle** (`package.json` declares `dsh.bundle`, and
`cordis.patch.yml` carries the patch). Install it into the `web` profile
with the standard `dsh plugin` mechanism — **no DSH source changes and no
hand-written patch**:

```sh
dsh plugin --profile web add github:omdsh-dev/dsh-webbridge
```

For a stable install, pin the version:
`dsh plugin --profile web add github:omdsh-dev/dsh-webbridge#v0.0.3`.

Internally the command runs `pnpm add <spec>` in the profile directory and
automatically appends packages that declare `dsh.bundle` to
`dsh.profile.bundles`. You can also clone it and install from a local path
(for development):

```sh
dsh plugin --profile web add /path/to/dsh-webbridge
```

The repository ships its build output (`lib/`), so the plugin works right
after installing — no build step needed. After installing, **restart the Web
UI** (production mode has no hot reload) and refresh the page — the
`webbridge_*` tools become available to the model.

### Upgrade

```sh
dsh plugin --profile web update github:omdsh-dev/dsh-webbridge
```

For a local-path installation, run `add` again against the replacement
checkout, then restart the Web UI and refresh.

### Uninstall

```sh
dsh plugin --profile web remove dsh-webbridge
```

The command runs `pnpm remove <pkg>` in the profile directory and removes
the package from `dsh.profile.bundles`. After uninstalling, restart web and
refresh — the DSH built-in plugin (same row id `webbridge`) takes over again.

### Relationship to the DSH built-in

DSH's official `dsh-web-app` bundle ships a built-in plugin of the same
nature (`@deepseek-ai/dsh-webbridge`, row id `webbridge`). This repository
is the independent open-source edition, distributed as
`dsh-webbridge`: installing it **overrides the built-in by the
same row id** and uses this package's code; without it, the built-in applies.
The tools behave identically — same protocol layer — the difference is only
who maintains the package.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Tools fail with `daemon_unreachable` | The Kimi WebBridge daemon is not running — start it with `~/.kimi-webbridge/bin/kimi-webbridge start`, then confirm with `kimi-webbridge status` |
| `kimi-webbridge status` shows `"extension_connected": false` | Install the Kimi WebBridge browser extension (Chrome Web Store) and let it connect to the daemon; restart the browser if it still shows disconnected |
| `webbridge_*` tools not visible to the model after install | The Web UI must be restarted and the page refreshed (production mode has no hot reload); verify the bundle row is in the profile (`dsh --profile web --dump-config \| grep webbridge`) |
| Clicks / fills ignored on some sites | Sites that strictly check `event.isTrusted` (banking portals, captchas) ignore synthetic events; the daemon's `cdp` escape hatch is not exposed as a tool yet |
| Snapshot / click / fill / evaluate miss an iframe | Cross-origin iframes are not supported — these tools operate on the top frame only |
| Screenshots return a path but no image | The daemon writes to a temporary path and returns the path; use a Read tool to view the image |
| Tab groups suddenly empty | Tab groups are maintained by the daemon; restarting the daemon clears them — recreate the session |

## Repository specifics

### How it works

```
model ── webbridge_* tools ──▶ dsh-webbridge plugin
                                   │ POST /command
                                   ▼
                         kimi-webbridge daemon (127.0.0.1:10086)
                                   │
                                   ▼
                         WebBridge browser extension
                                   │
                                   ▼
                         user's REAL browser (with logins)
```

Every tool call is one HTTP round-trip to the local daemon. The returned
payload is folded into a compact one-line `summary` plus the raw `detail`.

### Directory structure

```
dsh-webbridge/
├── src/               # plugin source: index.ts (registration), tools.ts (the 11
│                      #   webbridge_* tools), client.ts (HTTP client), invariant.ts
├── lib/               # committed build output (tsc types + tsdown bundle) — git
│                      #   installs consume this directly
├── tests/             # client.spec.ts — unit tests against a mock HTTP daemon
├── scripts/           # build.mjs (bundle build), verify-i18n.mjs (bilingual check)
├── cordis.patch.yml   # the DSH bundle patch — row id `webbridge` (overrides built-in)
├── README.md          # English main readme
├── README.zh.md       # Chinese readme
└── package.json
```

### Known limitations

- **`event.isTrusted`** — sites that strictly check trusted input (some banking
  portals, captchas) ignore synthetic `click`/`fill`; the daemon's `cdp`
  escape hatch is not exposed as a tool yet
- **Cross-origin iframes** — snapshot/click/fill/evaluate operate on the top
  frame only
- **Screenshots** — the daemon writes to a temp path and returns the path; the
  model must use a Read tool to view the image
- **Daemon lifecycle** — tab groups are maintained by the daemon; restarting
  the daemon clears them

## Development and verification

```sh
pnpm install
DSH_CHECKOUT=/path/to/dsh pnpm run build   # tsc → lib/types, tsdown → lib/index.js
```

Peer dependencies and the toolchain come from DSH: set `DSH_CHECKOUT` to a
source checkout, or have `dsh` on `PATH` and run it once. `lib/` is
committed, so git installs consume the built artifacts directly — no build
needed. Unit tests (`tests/client.spec.ts`) run against a mock HTTP daemon,
so no real Kimi install is required; run them in an environment with vitest
(e.g. the DSH checkout), and set `KIMI_WEBBRIDGE_IT=1` to run the integration
tests against a live daemon.

Keep the bilingual README in sync: edit both `README.md` and
`README.zh.md`, then run `node scripts/verify-i18n.mjs --write`.

## Community and About

- Use [GitHub Issues](https://github.com/omdsh-dev/dsh-webbridge/issues) for
  reproducible bugs, focused feature requests, and usage questions.
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes; report
  vulnerabilities privately via [SECURITY.md](SECURITY.md).
- Follow releases and compatibility notes in [CHANGELOG.md](CHANGELOG.md).
- **Acknowledgements & trademarks**: this plugin's protocol layer is
  compatible with [Kimi WebBridge](https://www.kimi.com/). Kimi WebBridge is a
  product and trademark of Moonshot AI; its daemon, browser extension, and
  their code belong to Moonshot AI and must be installed and used under Kimi's
  own terms. This plugin is an HTTP-protocol adapter only and contains none of
  that code.

## License

BSD-3-Clause. See [LICENSE](LICENSE).
