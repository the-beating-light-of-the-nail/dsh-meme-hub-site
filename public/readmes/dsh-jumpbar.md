# dsh-jumpbar

User message jump bar for the DeepSeek Harness (DSH) web GUI.

A minimap-style dash strip floats at the right edge of the conversation
scrollport. Every dash maps to one of *your* messages (kind `user` only, not
steering bubbles), positioned by the message's real vertical ratio inside the
transcript. Hover a dash to preview the message content; click to smooth-scroll
the message to the top with a short brand-color highlight.

## Install

```sh
dsh plugin --profile web add dsh-jumpbar
```

Restart `dsh web`, then open any conversation with at least one user message —
the strip appears on the right edge of the chat column.

## What you get

- **Minimap-style positioning** — dash spacing reflects how messages are spread
  through the transcript, so you can see at a glance where each user message sits.
  A thin viewport marker inside the strip tracks your current reading position.
- **Hover preview** — a bubble beside the strip shows the message's text
  (action buttons and clock are stripped from a cloned row; the product DOM is
  never touched), and the matching message row is faintly highlighted in the
  transcript. Keyboard-focusable, no pointer required.
- **Click to jump** — smooth-scrolls the target message to the top (12px gutter)
  and flashes a highlight overlay at the settled position.
- **Drag to scrub** — press the strip (between dashes) and drag to move through
  the transcript; pointer capture keeps the gesture alive outside the strip.
- **Live updates** — new messages, loaded history, window/column resizes, and
  session switches recompute the strip via MutationObserver + ResizeObserver
  with rAF throttling; stale previews and cache entries are dropped on change.
- **Zero footprint** — hidden entirely while no user message exists; floats in
  `shell.overlay`, never squeezing the conversation layout.

## How it works

Pure browser-side plugin. It registers one `shell.overlay` entry and measures
the product's own data attributes (`[data-conversation-scroll]`,
`[data-chat-flow-kind="user"]`, `[data-chat-anchor-key]`), so it needs no host
logic and changes no product code.

## Development

```sh
dsh plugin --profile web add link:D:/dsh/dsh-jumpbar
# or from the checkout directory:
dsh plugin --profile web add .
```

## License

MIT
