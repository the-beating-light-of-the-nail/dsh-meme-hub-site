# dsh-hybrid-memory

融合 **Hermes 轻量快照记忆** 与 **Noema 可检索知识库** 的 DeepSeek Harness 记忆插件。

> Hybrid memory plugin for DeepSeek Harness — combining Hermes-style frozen-snapshot memory with Noema-style searchable knowledge base.

## 为什么有这个插件（Why）

- **Hermes 的记忆**（`MEMORY.md` / `USER.md`）轻量、省 token、保 prefix cache，但不可检索、无审核。
- **Noema**（dsh-noema）可检索、可导入、可解释，但需要 Rust 二进制服务端、每次召回动 prompt。
- **dsh-hybrid-memory** 各取所长：

| 层 | 抄谁 | 做什么 |
|---|---|---|
| **L1 常驻快照** | Hermes | `MEMORY.md`/`USER.md`，会话组装时冻结注入 system prompt；中途写入不改已注入内容（保 prefix cache）；字符上限（与模型无关） |
| **L2 知识库** | Noema | `facts/` 一事实一文件 + `node:sqlite` FTS5 索引 + 实体抽取；按需 `memory_recall`/`search`/`browse` |
| **L3 导入** | Noema | 从 Hermes / Claude Code / Codex / WorkBuddy 导入既有记忆，内容哈希账本去重 |

## 数据位置（重要）

**记忆数据放在 D 盘，绝不落 C 盘：**

```
D:\Develop\DeepSeek Harness\memory\
├── MEMORY.md        ← L1 agent 笔记（环境事实/项目约定/工具怪癖）
├── USER.md          ← L1 关于用户（偏好/沟通风格/习惯）
├── facts/           ← L2 一事实一文件（人类可读 Markdown，active 状态）
├── pending/         ← 审核队列：review=true 的内容先进这里，接受后移到 facts/
├── index.db         ← L2 SQLite FTS5 索引
└── imports.json     ← L3 导入去重账本
```

可用环境变量 `DSH_HYBRID_MEMORY_ROOT` 覆盖默认根目录。

> **Hermes 导入路径**：插件会自动探测 Hermes 记忆位置——优先 `HERMES_HOME` 环境变量，其次常见安装路径（`D:\Develop\hermes`、`~/.hermes`、`~/hermes`），取第一个存在 `memories/` 目录的位置。你的机器实测是 `D:\Develop\hermes\memories\`。

## 安装

```sh
# 从 npm（发布后）
dsh plugin --profile web add @frog755/dsh-hybrid-memory@latest

# 或本地开发（源码目录）
dsh plugin --profile web add link:D:\Develop\DeepSeek Harness\projects\dsh-hybrid-memory
dsh web
```

首次安装需要重启一次 DSH（全新插件必须进入启动树）；之后热重载即可。

## 模型工具（11 个）

| 工具 | 层 | 作用 |
|---|---|---|
| `memory_add` | L1 | 新增常驻条目（memory=agent 笔记 / user=关于用户） |
| `memory_replace` | L1 | 按标题替换常驻条目 |
| `memory_remove` | L1 | 按标题删除常驻条目 |
| `memory_remember` | L2 | 保存知识库事实（默认 auto-accept；`review=true` 进审核队列） |
| `memory_search` | L2 | FTS5 + 实体加权全文检索 |
| `memory_browse` | L2 | 浏览知识库目录 / 按 tag 过滤 |
| `memory_recall` | L1+L2 | 融合召回：快照 + 检索结果按 token 预算打包 |
| `memory_import` | L3 | 从 Hermes/Claude/Codex/WorkBuddy 导入 |
| `memory_status` | 管理 | 数据根、字符用量、事实数、待审数、账本大小 |
| `memory_review_list` / `memory_review_decide` | 审核 | 查看/接受/拒绝/编辑候选记忆 |

## 设计要点

- **冻结快照 + prefix cache**：L1 在首轮 system prompt 组装时读文件，会话中途 `memory_add` 等写入落盘但不改动已组装内容 → KV cache 前缀不失效，省 token。
- **字符上限而非 token 上限**：L1 限制（agent 4000 / user 2000 字符）与模型无关，跨模型一致（Hermes 原设计）。
- **中文检索**：FTS5 的 unicode61 不切中文，插件在写入索引前用 2 字滑窗预分词，`memory_search` 按词匹配。
- **威胁扫描**：写入内容检测提示注入 / 外泄 / 危险指令，命中即拒。
- **原子写 + 漂移检测**：写文件走临时文件 + rename；磁盘内容被外部编辑破坏结构时拒绝写入并留 `.bak` 快照。
- **审核队列**：默认 `auto-accept`（Hermes 风格直接写）；需要时 `memory_remember(review=true)` 写入 `pending/`（文件 + SQLite status=pending），`memory_review_decide(accept)` 会把 Markdown 移到 `facts/` 并转正，`edit` 会同步重建 FTS 索引。

### 记忆注入（无需手动调工具）

除了 11 个工具，插件还通过 Cordis 事件自动注入记忆：

- **`agent/pre-step`**：会话首步（turn=1, step=1），或用户消息命中记忆触发词（记忆 / memory / recall / 之前 / 上次 / 偏好 / 记得 / 我们聊过 / context）时，按查询召回 L2 事实并作为 `memory-injection` 消息追加进 step；首步无命中时注入记忆库目录（最新事实标题），让模型"读过"记忆库、知道可以主动 `memory_search`。
- **`tools/post-execute`**：`skill` 工具成功加载后，把与该 skill 相关的 L2 事实拼进工具结果内容（绝不使用 `additionalContexts`——那会被 agent-loop 插进 next-step 队列触发自动下一轮，造成自激循环）。

L1 本身通过 `systemPrompt.section` 常驻注入，两层记忆都无需手动调用即到达模型。

### HTTP 端点（可选）

插件还在 DSH web server 上暴露两个端点：

- `GET  /__hybrid-memory/status` — 状态 JSON（数据根、L1 字符用量、L2 事实/待审数、账本大小）
- `POST /__hybrid-memory/import` — 触发导入，可选 body `{ "sources": ["hermes", ...] }`

## 开发

```sh
node --test tests/core.test.js   # 运行单元测试（24 个，覆盖 L1/L2/L3 核心逻辑）
```

## 截图

| DSH 设置中的插件列表（真实界面） | 架构示意 |
|---|---|
| ![plugin list](https://raw.githubusercontent.com/Frog755/dsh-hybrid-memory/b13d0fc69924f13b59ebd4720fba83e580039bba/assets/plugin-list.png) | ![architecture](https://raw.githubusercontent.com/Frog755/dsh-hybrid-memory/b13d0fc69924f13b59ebd4720fba83e580039bba/assets/architecture.svg) |

## 兼容性

- DeepSeek Harness（Cordis 架构），web profile
- Node.js 22.5+ —— 插件使用内置 `node:sqlite` 模块（`DatabaseSync`），无原生依赖
- peer 依赖：`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-tools`

## 隐私说明

**记忆数据全部留在本地。** 插件只写入配置的数据根目录（默认 `D:\Develop\DeepSeek Harness\memory`，可用 `DSH_HYBRID_MEMORY_ROOT` 覆盖），不向任何外部服务发送数据。L1 快照注入本地 DSH 实例的模型 prompt；L2 事实按需查询。无遥测、无网络调用。

## License

MIT
