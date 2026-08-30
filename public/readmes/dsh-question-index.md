# dsh-question-index

DSH Web 客户端插件：**提问索引（Question Index）**。在会话右侧悬浮展示「用户提过的问题」的按序列表，可收起；点击某条问题即可把会话滚动跳转到对应的提问位置。

A DSH client plugin that floats an ordered, collapsible list of the user's asked questions on the right side of the conversation, with click-to-jump into the flow.

## What it does

- A `shell.overlay` entry (root scope, floating layer) declares the
  session-level seat `question-index.panel`.
- The panel reads the current session's `chat` snapshot, walks nodes in
  `chat.order` order, keeps only `user` / `steering` question nodes, extracts
  their text blocks (`{ type: 'text' }` content) and renders an ordered list.
- Clicking an item scrolls the conversation to that question via
  `data-chat-anchor-key` inside `[data-conversation-scroll]` (same anchor
  logic as `ChatView`).
- The panel collapses to a slim right-edge strip and expands again; the
  collapse state persists across session switches.

## Features

- Ordered question list (numbered from 1) for the active session
- Click-to-jump into the conversation flow
- Collapsible floating panel anchored to the right of the conversation
- Collapse state preserved across session switches
- Empty state: "No questions yet" when the session has no user questions
- Localized (English / Simplified Chinese)
- **Auto-indexes full history**: opening a session automatically pages through
  its complete history, so old or never-visited sessions get every question in
  the index with no manual scrolling.
- **Durable local memory**: the index is persisted to localStorage, so it
  survives page reloads and reopens.

## Install

```bash
# from npm (recommended: prebuilt, no build-approval step)
dsh plugin --profile web add dsh-question-index

# or from GitHub source
dsh plugin --profile web add github:lijinhao315/dsh-question-index
```

## Development

```bash
npm install
npm run build   # tsc -p tsconfig.json && tsdown
```

Outputs `lib/index.js` (node half), `lib/invariant.js`, `lib/client.js`
(browser half).

## Known limitations

- Click-to-jump requires the target row to be rendered
  (`data-chat-anchor-key` present in the DOM); unrendered rows are skipped.
- Long entries render as a single truncated line; the full text is always
  visible in the conversation body.

## Architecture

See [docs/architecture.md](docs/architecture.md) for how the plugin wires into
the DSH shell (overlay seat, panel contribution, module-table externals).

## License

MIT
