# @kuanfu0430/dsh-sidebar-branch-chat

Adds a **Branch Chat** tab to [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar): open an independent archived session from the current main chat, inject a head / middle / tail context digest, and run with the same tools as the main agent. Branch history stays in the branch session and does not appear in the main chat list.

在 [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) 新增「分支對話」頁籤：從目前主對話開出獨立的封存 session，注入頭／中／尾脈絡摘要，並使用與主 agent 相同的完整工具。分支內容只寫進分支 session，不會進入主對話列表。

## Runtime dependency / 執行期依賴

This plugin is a companion tab. It does **not** vendor or fork Better Sidebar.

本插件是 companion 頁籤，不 fork、不安裝第二份、不修改 Better Sidebar。

| Dependency | Role | awesome-dsh-plugin |
| --- | --- | --- |
| [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) (`dsh-better-sidebar` ≥ 0.11.0) | Provides `ctx.betterSidebar.registerTab` | listed as [`omdsh-dev/DSH-better-sidebar`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/data/plugins/omdsh-dev__DSH-better-sidebar.yml) |

Install Better Sidebar first. If the service or `registerTab` is missing, this plugin stays loaded but hides the Branch Chat tab and logs the missing capability.

請先安裝 Better Sidebar。缺少 service／`registerTab` 時，本插件仍會載入，但只停用分支頁籤並寫出缺少的能力。

The planned listing for this repository is in [`docs/awesome-dsh-plugin.yml`](docs/awesome-dsh-plugin.yml). After it is merged into [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin), [dsh-market](https://github.com/dsh-market/dsh-market) can pick it up from the curated registry.

本倉預定上架條目見 [`docs/awesome-dsh-plugin.yml`](docs/awesome-dsh-plugin.yml)。合併進 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 後，[dsh-market](https://github.com/dsh-market/dsh-market) 會從精選目錄收錄。

## Install / 安裝

```sh
# 1. Better Sidebar (already on the curated list / 已在精選目錄)
dsh plugin --profile web add dsh-better-sidebar

# 2. This plugin from GitHub / 從 GitHub 安裝本插件
dsh plugin --profile web add github:kuanfu0430/dsh-sidebar-branch-chat
```

Restart `dsh web`, then open the **Branch Chat** tab from the Better Sidebar tab strip.

重啟 `dsh web`，在 Better Sidebar 頁籤列開啟「分支對話」。

The root `package.json` declares `dsh.bundle.patch` plus `cordis.patch.yml`, so `dsh plugin add` can install it. There is no build step.

根目錄 `package.json` 已宣告 `dsh.bundle.patch` 與 `cordis.patch.yml`，可直接用 `dsh plugin add` 安裝，無需編譯。

## How it mounts / 掛載方式

- Optional peer: `dsh-better-sidebar >= 0.11.0`. The profile must provide the single Better Sidebar instance.
- All cross-plugin calls go through `compat.js`. Only the public `ctx.betterSidebar.registerTab` API is used. New behaviour is gated on capability membership, not on a guessed minor version.
- Host half uses empty session + `agents.create` / `resume`. Branches are not subagents: the main chat gets no subagent lifecycle events, and the branch cannot hook back into the main session.

## Features / 功能

- One blank composer: the first send creates the branch (label = first 20 characters of the message); later sends continue that branch.
- The branch is a **new empty session**. It does not copy main-chat events. Context is a head / middle / tail sandwich (first user text, middle heuristic titles, last completed turn including tools), marked as reference-only.
- The branch agent joins the main agent's **currently running preset generation** (`composeFrom`): same tool roster and model family. A deployment with no roster stays empty; the plugin does not pretend tools exist.
- The branch is archived immediately (`archiveSession`). Archive failure reports failure and disposes the handle. The branch is invisible in the main session list and search; it only lives in the sidebar tab.
- The tab shows user messages and assistant replies. Digest text, branch frame hints, and tool arguments / results are hidden. While busy it shows a spinner plus status (thinking / `{Tool}` / answering). Answers grow from `text-delta` (300 ms poll while busy).
- Assistant bubbles use the official platform `MarkdownText` seed (same GFM / sanitizer as the main chat). User messages stay plain `pre-wrap` text.
- Toolbar: switch existing branches (●/○) and pick this branch's model / reasoning effort. Stop is the footer button (empty + busy = stop). Enter with text steers the current turn; empty Enter flushes a queued follow-up without stopping.
- In-flight extra messages appear as a queue above the input. The branch copies the main chat permission preset, including Full access sandbox. If the policy is ask, sandbox elevation is answered inside the tab (`allowed-once` / reject). `allowed-once` grants are not inherited. `ask_user_question` is not answered in the tab.

## Limits / 限制

- Branches follow the main session lifetime: create / continue only while the main chat page is open. Closing the main page pauses the branch; transcripts stay in durable storage.
- Transcripts are JSON polling (idle 1.5 s, busy 300 ms). A cold branch stops event polling after `live: false` until the next send or manual switch. This version does not use SSE.
- **Chat isolation is not workspace isolation.** The branch reuses the main session `cwd` and the full write tool set. File / shell / git side effects share the main working tree. The frame hint is a model-visible soft constraint, not a permission boundary.

## Known behaviour / 已知行為

- Context inheritance is the sandwich, not an event copy. It cuts at the last complete `turn/end`. Head is the first raw user text; middle lists intervening user questions; tail keeps that turn's tool call / result. In-progress turns are omitted. Caps are in `digest.js` (16 KB per tool result, 64 KB total).
- Custom early-compaction policies from other plugins do not apply to branches. Branches use the official 80% safety net.
- Digest and frame hints are model-visible and stripped from the UI projection.
- After archive, the tab can still list / continue the branch (live store + sessionQuery). `archive` / `create` success means the archive write completed.
- When the main session leaves the store, its branch agents stop (`session/disposed`). If the main chat closes mid-create / resume, the new handle is disposed. The branch session itself remains; reopening the main chat can continue it.
- Preset still follows the main agent's live generation (`composedPreset` + `composeFrom`). Model choice is per-branch: the side panel can pick any routable model, does not follow the main chat, and never calls `saveSelection` / `session.selectModel`.
- `archive` stops the current turn, then hides the branch from the main list.
- Historical `subagent-settled` notices in old main chats come from the v1 subagent design. The current design emits none.

## API

Host routes under `/sidebar-branch/api/*` are available only on loopback / the trust fence (same rules as Better Sidebar).

- `create { sessionId, message, provider?, model?, reasoningEffort? }` → `{ childId }`
- `message { sessionId, childId, text, provider?, model?, reasoningEffort? }` → `{ ok: true }`
- `flush { sessionId, childId }` → `{ ok: true, flushed }`
- `stop { sessionId, childId }` → `{ ok: true, outcome }`
- `archive { sessionId, childId }` → `{ ok: true }`
- `list { sessionId }` → `{ branches: [{ id, label, activity }] }`
- `events { sessionId, childId, afterSeq }` → `{ live, seedLength, events, nextSeq, total, busy, status, draft, queue, approvals }`
- `decide { sessionId, childId, approvalId, outcome }` → `{ ok, outcome }` (`allowed-once` / `rejected`)
- `models { sessionId, childId? }` → `{ current, routable, groups, failures }`
- `selectModel { sessionId, childId?, provider, model, reasoningEffort? }` → `{ selected }`

## Development / 開發

```sh
node --check index.js client.js compat.js composer.js digest.js interaction.js project.js
node ./test.mjs
```

## License

[MIT](./LICENSE)
