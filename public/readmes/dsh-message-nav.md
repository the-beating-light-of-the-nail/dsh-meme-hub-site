# dsh-message-nav

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Codex 风格的左侧消息导航轨道，用于在 DeepSeek Harness Web UI 的长会话中快速定位历史提问。

> 本项目 fork 自 [wx-yss/dsh-message-rail](https://github.com/wx-yss/dsh-message-rail)。感谢原作者及所有贡献者为项目奠定的基础。

> 交互灵感来自 Codex 的消息导航栏。本项目与 OpenAI 无关联。

## 效果预览

将鼠标悬停在刻度上，可以查看对应的用户消息及回答摘要；点击刻度可跳转到该消息。

![轨道悬停预览](https://raw.githubusercontent.com/foooold/dsh-message-nav/545690e4d1339bced1b340e2f7f916c9e1e1e54c/assets/rail-hover-preview.png)

轨道位于会话区左侧，并自动跟随 DeepSeek Harness 的明暗主题。

![轨道整体效果](https://raw.githubusercontent.com/foooold/dsh-message-nav/545690e4d1339bced1b340e2f7f916c9e1e1e54c/assets/rail-left-edge.png)

## 功能特性

- **消息导航**：为普通提问和运行中插话生成等距刻度，快速浏览长会话。
- **悬停预览**：当前刻度及相邻刻度形成波纹效果，右侧显示单行用户消息和最多四行回答摘要。
- **点击跳转**：平滑滚动到对应消息，并以中性灰描边短暂高亮目标位置。
- **完整索引**：在后台逐页加载会话历史，无需手动翻页。
- **当前位置提示**：滚动会话时，高亮最接近视口阅读位置的消息刻度。
- **虚拟滚动**：仅渲染轨道可见区域附近的刻度，在长会话中保持流畅。
- **自动跟随**：默认定位到最新消息；手动滚动轨道后停止跟随，方便查看较早内容。
- **无障碍适配**：支持键盘聚焦，并在系统启用“减少动态效果”时关闭过渡动画。

> 会话中少于 4 条可索引的用户消息时，导航轨道不会显示。

## 环境要求

- DeepSeek Harness `0.1.0-rc.6` 或更高版本
- Node.js 22+
- pnpm（需已加入 `PATH`；未安装时可运行 `npm install -g pnpm`）
- 最新版 Chrome、Edge、Safari 或 Firefox

## 安装

安装完成后请完整停止并重新启动 DSH Web UI。打开至少包含 4 条可索引用户消息的会话后，左侧会显示导航轨道。

### 从 npm 安装（推荐）

```bash
# 方式一：已全局安装 DSH CLI
dsh plugin --profile web add dsh-message-nav

# 方式二：使用 npx，无需全局安装
npx --yes -p @deepseek-ai/dsh dsh plugin --profile web add dsh-message-nav
```


### 从 Github 安装

```bash
# 方式一：已全局安装 DSH CLI
dsh plugin --profile web add github:foooold/dsh-message-nav

# 方式二：使用 npx，无需全局安装
npx --yes -p @deepseek-ai/dsh dsh plugin --profile web add github:foooold/dsh-message-nav
```

### 从本地源码安装：

```bash
git clone https://github.com/foooold/dsh-message-nav.git
cd dsh-message-nav

# 方式一：已全局安装 DSH CLI
dsh plugin --profile web add .

# 方式二：使用 npx，无需全局安装
npx --yes -p @deepseek-ai/dsh dsh plugin --profile web add .
```

## 更新与卸载

### 从 npm 更新插件：

```bash
# 已全局安装 DSH
dsh plugin --profile web update dsh-message-nav

# 使用 npx
npx --yes -p @deepseek-ai/dsh dsh plugin --profile web update dsh-message-nav
```

### 卸载插件：

```bash
# 已全局安装 DSH
dsh plugin --profile web remove dsh-message-nav

# 使用 npx
npx --yes -p @deepseek-ai/dsh dsh plugin --profile web remove dsh-message-nav
```

更新或卸载后，也需要完整停止并重新启动 DSH Web UI。

## 使用方式

安装并启动 DSH Web UI 后，轨道的主要交互如下：

- 悬停或键盘聚焦刻度：展开波纹并显示消息预览。
- 点击刻度：跳转到对应的用户消息。
- 在轨道上滚动滚轮：浏览更早或更晚的刻度。
- 滚动会话：当前位置对应的刻度自动高亮。

## 已知限制

- 历史索引依赖 DSH 的 `loadOlder` 分页，每页加载 50 条消息，最多加载 400 页；超出范围的消息不会进入索引。
- 千条级长会话完成全部索引可能需要数秒。
- 仅索引普通提问（`kind === 'user'`）和运行中插话（`kind === 'steering'`），不索引助手回复、工具调用、命令或注入上下文（`kind === 'context'`）。
- 配色跟随 DSH 运行时主题，不提供独立的主题配置。
- 功能依赖 DSH 内部的会话数据和 DOM 锚点契约，后续 DSH 版本变化可能影响兼容性。

## 开发说明

当前仓库保留客户端实现和 DSH bundle patch，供阅读与后续开发：

```
├── package.json         # 包元数据、DSH 客户端与 bundle 声明
├── cordis.patch.yml     # DSH bundle patch
├── lib/
│   ├── index.js         # Host 端入口占位
│   └── client.js        # 轨道 UI、历史加载、虚拟滚动与消息跳转
├── assets/              # README 功能截图
├── LICENSE              # MIT License
└── README.md
```

实现概要：

- 通过 `shell.overlay` 为每个会话挂载独立轨道实例。
- 从会话快照读取消息顺序与节点，筛选普通提问和运行中插话。
- 通过 DSH 会话接口加载更早历史，并使用 DOM 锚点定位消息。
- 使用固定间距和缓冲窗口虚拟化轨道刻度，避免消息数量直接增加 DOM 规模。

## License

MIT
