# dsh-composer-stretch

[![npm version](https://img.shields.io/npm/v/dsh-composer-stretch)](https://www.npmjs.com/package/dsh-composer-stretch)
[![license](https://img.shields.io/npm/l/dsh-composer-stretch)](https://github.com/Pudge1996/dsh-composer-stretch/blob/main/LICENSE)

English | [中文](README.zh.md)

A composer expand plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). When the composer text wraps to 3+ lines, an expand button appears in the top-right corner of the composer; click to stretch the composer to fullscreen height, click again to restore the default height.

<img width="4114" height="2218" alt="image" src="https://github.com/user-attachments/assets/d2b6e6ce-33af-45ba-b95b-d3bf3206cbd7" />

The interaction is inspired by Gemini, with additional DSH-specific height adaption and scroll-through prevention fixes.

## Install

```sh
dsh plugin --profile web add dsh-composer-stretch
```

## Triggers

- **Conditional button** — the expand button appears in the top-right when the composer reaches 3+ lines.
- **Triple-newline auto-expand** — press `Shift+Enter` three times in a row to auto-expand.

## Expand behavior

- **Fullscreen composer** — the composer stretches to near-fullscreen height (adapted to avoid occlusion by the session title, image attachments, etc.).
- **Auto-collapse on send** — the composer restores its default height after sending a message.
- **Enter inserts newline** — in expanded mode, `Enter` inserts a newline and `Cmd/Ctrl+Enter` sends.
- **Scroll containment** — scrolling inside the expanded composer no longer chains through to the conversation background.

## Notes

- **Stable UI** — relies on stable `data-slot` anchors and DSH design tokens for high compatibility.
- **No persistence** — state resets on page refresh; no localStorage residue.
- **Frontend only** — no custom protocols, no host commands, no LLM calls, no session-log entries.

## License

MIT