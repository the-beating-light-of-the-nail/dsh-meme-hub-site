# dsh-word-complete

DeepSeek Harness Web 对话输入框的**词自动补全**插件（Notepad++ Word Completion 风格，host + client 一体包）：输入时从**当前会话出现过的词**中弹出补全建议，键盘 ↑/↓ 选择、回车确认。

## 效果

- 在输入框输入词前缀时（英文 ≥ 2 个字符、中文/日文/韩文 ≥ 1 个字符），光标上方弹出最多 8 条建议词；建议**以当前输入内容开头**（前缀匹配），并按**接近程度**升序排列：完全匹配（当前输入词本身）最前，其次附加字符更少（更接近），再词频更高。例如输入 `ds` 会联想 `dsh`、`dsh_workspace`、`dsh-word-complete`，而不会出现 `adds`、`cards`、`words` 这类输入在后面的词；
- 建议词来源：当前会话中用户与助手消息里出现过的词（英文/数字/下划线序列、中文、日文、韩文分词，过滤纯数字与超短词）；
- 键盘交互：↑/↓ 循环选择、回车确认插入、ESC 关闭；鼠标悬停高亮、点击确认；
- 确认后光标自动移到插入词末尾；**回车确认后按 Backspace 会立即重新弹出**（编辑刚插入的词）；空格键完全放行，不影响正常输入；
- 弹出窗口**跟随光标逐字移动**，出现在"当前输入的字符上方"；上方空间不足时自动翻转到光标下方。

## 行为细节

| 场景 | 行为 |
|---|---|
| 词前紧邻 `/` 或 `\` | 不弹出（可能是斜杠命令、文件路径或 URL） |
| 建议相关性 | 只出现**以当前输入内容开头**的词；`adds`/`cards`/`words` 这类输入在后面的词不显示 |
| 英文前缀不足 2 字符 | 不弹出（避免干扰） |
| 中文 1 字 | 即弹出 |
| 输入法组合（composition）期间 | 不弹出，组合结束恢复 |
| 确认/ESC 后 | 窗口关闭，直到输入新的可打印字符或 Backspace/Delete 才重新激活 |
| 选中词与当前前缀完全相同（已输完整词） | 视为"确认当前词"：直接关闭窗口，光标保持在词尾 |
| 词表为空（新会话） | 回退到本地持久化索引（历史会话累计词表），冷启动也有建议 |

## 架构与技术要点

- **host 端**（`lib/index.js`）：监听会话事件增量统计词频（`user/message`、`assistant/message`），内存缓存 + 增量持久化到 `$DSH_HOME/word-complete.json`（最近 30 个会话），通过 `webServer` 提供 `GET /api/word-complete/words?sessionId=`；
- **client 端**（`lib/client.js`，手写 bundle）：注册到官方 slot **`conversation.input.overlay`**（slash 菜单同款弹层槽位），session scope 注入 `useInput`；
- **插入走官方事件**：`actx.bail("slash/input-insert-text", { text, span })`——带 `draftRev` CAS 校验与撤销支持，不 hack 任何内部状态；
- **光标位置测量**：用 Range API 在官方 auto-grow 镜像 `[data-input-mirror]` 的文本节点上定位 caret 偏移——镜像与 textarea 共享完全相同的排版规则（font-family `DshChipCell`、padding、pre-wrap）并随滚动容器一起移动，测量结果即真实视口坐标，无需复制样式、无需滚动修正；
- **窗口定位**：`createPortal` 渲染到 `document.body` + `position: fixed`，脱离 slot 锚点与 transform 祖先的干扰；随输入/光标/滚动/窗口尺寸实时重测。

## 安装

```bash
dsh plugin --profile web add github:tuogusa/dsh-word-complete
```

兼容 Profile：`web`（DSH Web GUI）。安装后重启 DSH 并 `Ctrl+Shift+R` 强刷浏览器。

## 更新

```bash
# 方式一：CLI 更新（推荐）
dsh plugin --profile web update dsh-word-complete

# 方式二：重新从 GitHub 源安装/更新
dsh plugin --profile web add github:tuogusa/dsh-word-complete
```

> 说明：`dsh plugin` 是 pnpm 的前置转发器，`update` 会按当前依赖声明重新解析该包；通过 `github:tuogusa/dsh-word-complete` 安装时，会更新到仓库默认分支的最新提交。

## 验证

仓库自带离线验证脚本（33 项断言：分词、词频合并、持久化、bundle 形状、插入事件、前缀检测、前缀匹配排序）：

```bash
node verify.mjs
```

## 结构

```
cordis.patch.yml     bundle patch（loader 行）
lib/index.js         host 端：词频统计 + 持久化 + REST API
lib/client.js        client 端：补全 UI + 键盘交互 + 光标定位
docs/DESIGN.md       设计说明（架构、测量与交互决策依据）
verify.mjs           离线验证脚本
```

## License

MIT
