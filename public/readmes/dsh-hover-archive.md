# dsh-hover-archive

[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Codex-style hover archive for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web.

Hover a sidebar conversation row and an **Archive icon appears at the far right**; one click archives the session. No menus, no dialogs.

[简体中文](README.zh.md)

## Features

- **Hover → Archive icon at the far right of the session row**, exactly like the Codex conversation list.
- **One click archives** through the official `workspaces.archiveSession` API — the same face the built-in "…" menu uses, so archived sessions land in the same place and obey the same rules.
- **Blank rows untouched**: the "New Session" placeholder row never gets a button.
- **zh / en labels** follow the app locale and re-label live on locale switch.
- **Keyboard accessible**: the button is a real `<button>`; it reveals on `:focus-within` and fires on Enter/Space.
- **Busy / error states**: the icon dims while archiving and flashes the error color with the failure message as a tooltip if the call fails.
- **Zero dependencies, zero build step**: plain JavaScript, installs from source without any `allowBuilds` approval.
- **Self-tests**: `npm test` runs syntax checks plus a dependency-free DOM smoke test.

## Install

```sh
dsh plugin --profile web add github:zhifengjiang/dsh-hover-archive
```

Then restart `dsh web` (or your desktop client) and refresh the page.

Uninstall:

```sh
dsh plugin --profile web remove dsh-hover-archive
```

## How it works

- A **pure client plugin** (`dsh.client`, platform `web`) that injects a button into every actionable sidebar session row — the elements carrying `data-session-id`.
- The button is appended as the row's **last child**, so it renders to the right of the stock "…" row menu and is revealed purely by CSS on `:hover` (and `:focus-within`).
- A `MutationObserver` re-decorates rows across React re-renders; decoration is idempotent (one button per row, blank rows skipped).
- The click is intercepted in the capture phase (`stopPropagation` + `preventDefault`), so archiving never opens the session.
- Archiving calls `ctx.workspaces.archiveSession(id)`; the stock projection then removes the row from the list, and archiving the current session falls back to the same sweep the built-in action uses.

## Why a button instead of a menu item

The stock row already archives in two clicks (hover → "…" → Archive). This plugin restores the **Codex-style one-hover-one-click** affordance. DeepSeek Harness `0.1.0-rc.6` exposes no public slot for extra session-row actions, so the button is injected into the row DOM — the same workaround community plugins such as `dsh-session-manager` and `dsh-plugin-session-delete` rely on.

## Compatibility

- Built against **DeepSeek Harness `0.1.0-rc.6`** (the `@deepseek-ai/dsh-client-runtime` workspaces face).
- **Platform**: DSH Web. Any shell that renders the upstream web sidebar shows the button; a shell that replaces the sidebar with a native list may not.
- **Older harness builds** without `workspaces.archiveSession` are detected at runtime — the plugin logs a warning and disables itself instead of breaking the UI.
- Coexists with `dsh-session-manager`, `dsh-plugin-session-delete` and the built-in "…" menu: this plugin adds one more affordance on the same row and calls the same official API.

## License

[MIT](LICENSE)
