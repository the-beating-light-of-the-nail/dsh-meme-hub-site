# dsh-autoload-history

> 打开会话自动加载全部历史消息，免去反复点击「加载更早」。
> Automatically load the full conversation history when a session opens — no more clicking “Load earlier”.

[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue?style=flat-square)](https://github.com/topics/dsh-plugin)
[![MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

DeepSeek Harness（DSH）Web 打开会话时只加载最近 50 条消息，更早的内容要一页页手动点「加载更早」。本插件让打开会话即自动翻页，直到**整个会话完整加载**——长会话一进来就全部就绪，翻旧消息不再需要任何点击。

When DSH Web opens a session it only loads the latest 50 messages; everything older requires clicking “Load earlier” page by page. This plugin pages through the rest automatically the moment a session opens, until the **whole conversation is loaded** — no more clicking to reach old messages.

---

## 安装 / Install

### 从 GitHub 源码安装（推荐）/ From source (recommended)

```sh
dsh plugin --profile web add github:magicOF2/dsh-autoload-history
```

首次安装会请求 `allowBuilds` 构建授权（GitHub 源需要从源码构建），按提示允许后重试一次即可。 / First install asks for the `allowBuilds` build approval (GitHub sources build from source) — follow the hint and retry once.

### 从 npm 安装 / From npm

发布后可用： / Once published:

```sh
dsh plugin --profile web add dsh-autoload-history
```

npm 预构建安装会跳过 `allowBuilds` 步骤。 / Prebuilt npm installs skip the `allowBuilds` step.

---

## 使用 / Usage

零配置。安装后打开任意会话即自动生效： / No configuration. Open any session and it just works:

- 自动逐页加载（每页 50 条）直到整个会话全部就绪； / Pages automatically (50 messages per page) until the entire history is loaded;
- 切换会话自动跟随，互不干扰； / Follows session switches automatically;
- 加载不打断正常聊天（翻页与实时追加互不冲突）； / Loading never interrupts an active conversation;
- 全程无 UI 痕迹（隐形挂载在会话底部官方槽位）。 / Fully invisible — mounted in an additive session slot.

### 可选设置 / Optional settings（localStorage）

| 键 Key | 值 Value | 效果 Effect |
| --- | --- | --- |
| `dsh-autoload-history.disabled` | `'1'` | 整体停用自动加载（逃生开关）/ disable the plugin without uninstalling |
| `dsh-autoload-history.maxPages` | 正整数 | 单次打开会话最多自动翻的页数；缺省/`'0'` = 不限 / cap pages per session open; default unlimited |

```js
// 在 DSH Web 控制台执行 / run in the browser console
localStorage.setItem('dsh-autoload-history.disabled', '1')      // 停用
localStorage.removeItem('dsh-autoload-history.disabled')        // 恢复
localStorage.setItem('dsh-autoload-history.maxPages', '20')     // 只翻 20 页(约 1000 条)
```

非法值一律回落默认（启用、不限页）。 / Invalid values always fall back to enabled + unlimited.

## 工作原理 / How it works

- 挂载到官方会话级槽位 `conversation.composer.dock`（列表槽、零侵入，渲染 `null`）； / Mounts in the official session-scoped `conversation.composer.dock` list slot (additive, renders nothing);
- 通过槽位标准 props 拿到会话快照（`useSession` 选择器）与 `sessionId`； / Reads the conversation snapshot (`useSession`) and `sessionId` from the slot's standard props;
- 快照 `openState === 'open'` 且 `hasMore === true` 且未在翻页时，调用 `session.loadOlder()` 翻一页； / Whenever the snapshot is open with `hasMore` and no page in flight, calls `session.loadOlder()`;
- 每翻一页快照更新 → 自动触发下一页，直到 `hasMore === false`； / Each page updates the snapshot, which cascades the next page, until `hasMore === false`;
- 防呆：连续 3 页无进展自动放弃（故障时绝不死循环）。 / Guard: gives up after 3 consecutive no-progress pages (never hot-loops on a failing host).

详见 [docs/DESIGN.md](docs/DESIGN.md)。 / See [docs/DESIGN.md](docs/DESIGN.md).

## 兼容性 / Compatibility

- DeepSeek Harness `>= 0.1.0-rc.5`（Web profile）/ DeepSeek Harness `>= 0.1.0-rc.5` (Web profile)
- 纯浏览器端插件：无宿主行为、无数据上报、无网络请求 / Pure client plugin: no host behavior, no telemetry, no network requests
- 不修改任何官方文件，卸载即完全还原 / Does not modify any official files; uninstalling restores everything

## 开发 / Development

```sh
npm ci
npm run build   # 产出 lib/index.mjs（Node half）+ lib/client.js（浏览器 bundle）
npm test        # node --test:纯决策核心(翻页判定/守卫/设置解析)
```

## 许可证 / License

MIT © [magicOF2](https://github.com/magicOF2)

## 相关 / Related

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) — DSH 插件精选列表 / curated DSH plugin list
