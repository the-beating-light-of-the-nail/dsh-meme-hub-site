# dsh-composer-stretch

[![npm version](https://img.shields.io/npm/v/dsh-composer-stretch)](https://www.npmjs.com/package/dsh-composer-stretch)
[![license](https://img.shields.io/npm/l/dsh-composer-stretch)](https://github.com/Pudge1996/dsh-composer-stretch/blob/main/LICENSE)

中文 | [English](README.en.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 打造的输入框扩展插件。当输入框内容行数 ≥ 3 行时，输入框右上角出现扩展按钮；点击后输入框高度扩展到全屏，再点击恢复默认高度。

https://github.com/user-attachments/assets/3d15f435-284f-4cbe-87c1-e59e47c64667

整体交互体验与 Gemini 相似，针对 DSH 再做了些高度适配、修复滚动穿透背景等问题。

## 安装

```sh
dsh plugin --profile web add dsh-composer-stretch
```

## 触发方式

- **条件显示** — 输入框行数 ≥ 3 行时，右上角出现扩展按钮，点击可扩展输入框高度
- **三连换行自动扩展** — 连续按 3 次 `Shift+Enter` 自动进入扩展模式

## 扩展后效果

- **全屏输入** — 扩展后，输入框达到接近全屏高度（已做适配，不会被会话标题、输入框图片等组件遮挡）。
- **发送后自动折叠** — 发送消息后自动恢复默认高度，无需手动关闭
- **扩展时 Enter 换行** — 展开模式下 `Enter` 键换行，`Cmd/Ctrl+Enter` 发送
- **滚动不穿透** — 扩展后修复 DSH 输入框内滚动到边缘时会滚动背景对话区的问题

## 其他说明

- **已适配至 DSH v0.1.2-alpha.1**
- **稳定 UI** - 依赖高稳定性的 `data-slot` 标识 + DSH 官方设计令牌，兼容性好，与原生系统适配度极高。
- **不持久化** — 刷新页面恢复默认状态，无 localStorage 残留
- **纯前端** — 无自定义协议、无 host 命令、无 LLM 调用、不进会话日志

## License

MIT