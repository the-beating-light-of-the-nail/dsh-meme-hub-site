# dsh-hybrid-memory

融合 **Hermes 轻量快照记忆** 与 **Noema 可检索知识库** 的 DeepSeek Harness 记忆插件。

> Hybrid memory plugin for DeepSeek Harness — combining Hermes-style frozen-snapshot memory with Noema-style searchable knowledge base.

## 为什么有这个插件（Why）

- **Hermes 的记忆**（`MEMORY.md` / `USER.md`）轻量、省 token、保 prefix cache，但不可检索、无审核。
- **Noema**（dsh-noema）可检索、可导入、可解释，但需要 Rust 二进制服务端、每次召回动 prompt。
- **dsh-hybrid-memory** 各取所长：

| 层 | 抄谁 | 做什么 |
|---|---|---|
| **L1 快照** | Hermes | `MEMORY.md`/`USER.md`，按需读取——只在模型主动调用 `memory_*` 工具（如 `memory_recall`）时才进入上下文；字符上限（与模型无关） |
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

## 模型工具（12 个）

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
| `memory_import_agent_hub` | L3 | 只导入 Agent Hub approved memory/global、projects、accepted decisions |
| `memory_status` | 管理 | 数据根、字符用量、事实数、待审数、账本大小 |
| `memory_review_list` / `memory_review_decide` | 审核 | 查看/接受/拒绝/编辑候选记忆 |

## 设计要点

- **按需读取、零上下文开销**：L1 快照与 L2 知识库都不自动注入对话（无 `systemPrompt.section` 常驻注入、无 pre-step 召回、无 skill 附带记忆，v0.2.0 起）；只在模型主动调用 `memory_*` 工具时按需进入上下文。
- **字符上限而非 token 上限**：L1 限制（agent 4000 / user 2000 字符）与模型无关，跨模型一致（Hermes 原设计）。
- **中文检索**：FTS5 的 unicode61 不切中文，插件在写入索引前用 2 字滑窗预分词，`memory_search` 按词匹配。
- **威胁扫描**：写入内容检测提示注入 / 外泄 / 危险指令，命中即拒。
- **原子写 + 漂移检测**：写文件走临时文件 + rename；磁盘内容被外部编辑破坏结构时拒绝写入并留 `.bak` 快照。
- **审核队列**：默认 `auto-accept`（Hermes 风格直接写）；需要时 `memory_remember(review=true)` 写入 `pending/`（文件 + SQLite status=pending），`memory_review_decide(accept)` 会把 Markdown 移到 `facts/` 并转正，`edit` 会同步重建 FTS 索引。

### 记忆按需读取（无自动注入）

插件**不做任何自动注入**——L1 快照不再冻结进 system prompt，`agent/pre-step` 首步/触发词召回与 `tools/post-execute` skill 附带记忆均已移除（v0.2.0）。记忆只在模型判断需要时，主动调用 `memory_*` 工具查找后才进入上下文：

- 查知识库：`memory_search` / `memory_browse` / `memory_recall`（融合 L1 快照 + L2 检索）
- 查状态：`memory_status`（数据根、字符用量、事实数、待审数等）

代价：模型若忘记主动调用工具，记忆不会自动出现；换来的是上下文零记忆开销、无 `[系统注入·记忆]` 标签。

### HTTP 端点（可选）

插件还在 DSH web server 上暴露两个端点：

- `GET  /__hybrid-memory/status` — 状态 JSON（数据根、L1 字符用量、L2 事实/待审数、账本大小）
- `POST /__hybrid-memory/import` — 触发导入，可选 body `{ "sources": ["hermes", ...] }`

## 开发

```sh
# 核心逻辑（不需要宿主依赖）
node --test tests/core.test.js            # 32 个，覆盖 L1/L2/L3 核心逻辑

# Agent Hub 投影（前两个用例不需要宿主依赖；第三个会 import 插件本体）
node --test tests/agent-hub-source.test.js

# 冒烟测试：真实加载插件并断言事件/工具注册（需要 @deepseek-ai/* 可解析）
node --test tests/smoke.test.js
```

`@deepseek-ai/*` 通过 `devDependencies` 的 `link:` 指向本机 DSH 宿主目录，所以只有
「本机已装 DSH」的 clone 才能跑需要 import 插件本体的用例；裸 clone 或 CI 上这类
用例会自动 skip（不会红）。

## 截图

| DSH 设置中的插件列表（真实界面） | 架构示意 |
|---|---|
| ![plugin list](https://raw.githubusercontent.com/Frog755/dsh-hybrid-memory/738715b809b659d86b8bebd5a1b2bd1afbc09b64/assets/plugin-list.png) | ![architecture](https://raw.githubusercontent.com/Frog755/dsh-hybrid-memory/738715b809b659d86b8bebd5a1b2bd1afbc09b64/assets/architecture.svg) |

## 兼容性

- DeepSeek Harness（Cordis 架构），web profile
- Node.js 22.5+ —— 插件使用内置 `node:sqlite` 模块（`DatabaseSync`），无原生依赖
- peer 依赖：`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-tools`

## 隐私说明

**记忆数据全部留在本地。** 插件只写入配置的数据根目录（默认 `D:\Develop\DeepSeek Harness\memory`，可用 `DSH_HYBRID_MEMORY_ROOT` 覆盖），不向任何外部服务发送数据。L1 快照与 L2 事实都只在模型主动调用 `memory_*` 工具时按需读取进上下文，无自动注入。无遥测、无网络调用。

## License

MIT
