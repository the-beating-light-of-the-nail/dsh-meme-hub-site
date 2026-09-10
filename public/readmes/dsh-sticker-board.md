# dsh-sticker-board

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)
[![License](https://img.shields.io/github/license/sanqiPanax/dsh-sticker-board)](LICENSE)
[![CI](https://github.com/sanqiPanax/dsh-sticker-board/actions/workflows/ci.yml/badge.svg)](https://github.com/sanqiPanax/dsh-sticker-board/actions)

[English](README.en.md) | 中文

冰箱贴纸系统 for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web。

把常用任务做成一张张「冰箱贴」，贴在输入框上方：📰 24小时科技新闻、⭐ 推荐GitHub项目、📝 小黑盒草稿检查……按 **长期 / 短期** 分组，点一下贴纸，预置的 prompt 就自动发进**当前会话**，AI 立即开始执行——再也不用每次手打任务描述。

![贴纸栏](https://raw.githubusercontent.com/sanqiPanax/dsh-sticker-board/9124dea6e28dac018fcfd60c2695680fa2b1cecb/docs/screenshot-dock.png)

## 为什么做这个

有些任务几乎每天都会跑，但时间不定：刷科技新闻、看 GitHub 热门、检查发布草稿。每次都往输入框敲一大段 prompt 很烦，于是做了这个贴纸栏：

- **零成本启动**：贴纸栏就在输入框正上方，眼到即点，不用开侧边栏、不用建任务
- **按生活节奏分类**：长期（天天跑的）/ 短期（临时发起的），一目了然
- **即点即改**：hover 贴纸出现 ✏️/🗑，改动立即生效、立即持久化
- **普通消息语义**：点击发送的就是一条普通会话消息，可随时 Stop，误触零成本

## 安装

```sh
# 方式一：GitHub
dsh plugin --profile web add github:sanqiPanax/dsh-sticker-board

# 方式二：本地打包文件
dsh plugin --profile web add ./dsh-sticker-board-0.1.1.tgz
```

安装后**重启 `dsh web`**（浏览器强制刷新一次 Ctrl+F5），输入框上方出现贴纸栏即生效。

> 首次启动会自动写入 8 张预置贴纸到 `~/.dsh/sticker-board.json`，可直接增删改。

## 使用

### 点击执行

点任意贴纸 → 预置 prompt 以**排队模式**发进当前会话（不打断正在运行的 turn），AI 立即开始干活。

### 新增贴纸

1. 点贴纸栏最右侧的 **「＋」** 按钮
2. 填：**图标**（emoji）、**名称**、**分组**（长期/短期）、**任务 prompt**（点击后发给 AI 的任务描述）
3. 点**「保存」** → 新贴纸立刻出现在对应分组

### 编辑 / 删除

鼠标移到任意贴纸上，出现 **✏️ 编辑** 和 **🗑 删除** 两个小按钮；删除有确认框防误删。

### 预置贴纸

| 分组 | 贴纸 | 用途 |
|---|---|---|
| 长期 | 📰 24小时科技新闻 | 过去 24h 重要科技新闻中文简报（AI/芯片/互联网/游戏/硬件） |
| 长期 | ⭐ 推荐GitHub项目 | 5 个值得关注的 GitHub 项目及亮点 |
| 长期 | 📅 GitHub周报素材 | 本周周报素材收集（配图铁律评估） |
| 长期 | ✅ 今日复盘 | 已完成 / 进行中 / 待办复盘 |
| 短期 | 📝 小黑盒草稿检查 | 表格转PNG / 禁链接 / md2docx / check_draft.py 逐项检查 |
| 短期 | 📣 公众号发布检查 | author / 标题 / 图片占位 / 表格渲染 / 发布时段逐项检查 |
| 短期 | 🐦 X平台发言收集 | CDP 截图收集相关方发言 |
| 短期 | 🖼️ 图片识别 | 识别发送图片的内容与文字 |

预置贴纸的 prompt 是按常见工作流拟的草稿，直接用 ✏️ 改成你自己的即可。

## 工作原理

- **Host 端**（`lib/index.js`，零依赖）：贴纸 CRUD REST API + JSON 文件持久化，首次运行自动写入预置贴纸种子：
  - `GET /api/sticker-board/health` — 安装探针（返回插件版本与贴纸数，验证插件已加载）
  - `GET /api/sticker-board/stickers` — 全部贴纸
  - `POST /api/sticker-board/stickers` — 新增
  - `PUT /api/sticker-board/stickers/:id` — 更新
  - `DELETE /api/sticker-board/stickers/:id` — 删除
  - 数据存 `~/.dsh/sticker-board.json`；写入经单条 promise 链串行化，并发编辑不会损坏文件
- **Client 端**（`lib/client.js`）：React 组件注册官方 `conversation.input.dock` 槽位（composer 卡片上方的全宽条，官方 goal 插件同款座位）；点击贴纸通过 `ctx.conversation.sendSession(session, prompt, [], 'queue')` 走与手动发送相同的宿主准入路径进入当前会话

## 注意事项

- 贴纸 prompt 走的是**普通排队消息**：当前会话有 turn 在跑时会排队等它结束（如需打断请用输入框的插话/steer）。
- 与 [dsh-task-board](https://github.com/zhu1090093659/dsh-web-ui)（任务看板）定位不同：本插件是**轻量快捷命令**，没有状态机 / cron / 执行记录；要定时跑任务可用任务看板，两者可共存。
- 插件只读写本地 JSON，不上传任何数据。

## 开发

```sh
npm pack                      # 打包 tgz
dsh plugin --profile web add ./dsh-sticker-board-0.1.1.tgz
```

修改代码后记得 bump `package.json` 版本号再打包（pnpm 对同版本号 tgz 有缓存）。

## License

MIT
