# l123-harness —— L1-L2-L3 三级记忆 Agent 底座

把一套经过实战检验的 agent 方法论打包成插件：**Claude Code 插件** + **DeepSeek Harness (dsh) 组合包**，同一套内容双宿主分发。设计对齐「一切皆插件」：
**宿主是内核，本插件只提供能力组件**——上下文注入、门禁、事件记录、记忆提炼，
全部可单独理解、可整体装卸。项目知识不在插件里：插件装机后由项目自己积累。

> **English** — l123-harness packages a battle-tested agent methodology as a
> plugin for both [Claude Code](https://code.claude.com) and
> [DeepSeek Harness (`dsh`)](https://github.com/deepseek-ai/deepseek-harness):
> a three-tier memory system (L1 always-on `CLAUDE.md` / L2 index / L3
> details) plus gate approval for protected files, a zero-judgement event
> log, weekly distillation, and a TDD execution loop. Install for dsh:
> `dsh plugin --profile web add github:reatcat/l123-harness`

## 四条原则（方法论内核）

1. **状态放模型外**：结论、计划、进度写盘，上下文只装当前任务需要的一小部分。
2. **客观观察**：测试红绿、命令输出、日志数据才是判据；推理不是证据。
3. **内层不发散**：spec 管计划、计划管步骤边界、TDD 管停止条件。
4. **升级需审批**：memory 随手写；升级为 knowledge / skill / L1 / L2 必须用户批准。

## 三级记忆

| 层 | 载体 | 特点 |
|---|---|---|
| L1 常驻 | `CLAUDE.md` | 小而稳定的缓存前缀：原则、优先级、安全底线、路由表 |
| L2 索引 | `.agents/INDEX.md` | 症状→一句规则→L3 指针；SessionStart hook 自动注入 |
| L3 详情 | `.agents/**` | knowledge / pitfalls / runbooks / current / events / inbox |

## 组件清单

```
l123-harness/
├── .claude-plugin/plugin.json      # Claude Code 插件清单
├── package.json                    # dsh 组合包清单（dsh.bundle）
├── cordis.patch.yml                # dsh 组合层：插入本插件行
├── dsh/index.js                    # dsh 入口：注册技能 + 挂载官方 hooks 桥接
├── hooks/
│   ├── hooks.json                  # 事件接线（6 个生命周期事件）
│   ├── on-session-start.sh         # 记事件 + 注入 L2 索引
│   ├── gate-guard.sh               # PreToolUse 门禁：保护清单 + 一次性审批令牌
│   ├── on-post-tool.sh             # 工具报错 → tool_error 事件（热路径零解释器）
│   ├── on-pre-compact.sh           # 压缩前抢救 .agents/current/ 为 checkpoint
│   ├── on-stop.sh / on-session-end.sh  # 边界事件记录
│   └── lib-event-log.sh            # 事件库：不可变、按月滚动、绝不阻塞主流程
├── skills/
│   ├── init-harness/               # /l123-harness:init-harness 装机（含 init.sh）
│   ├── event-review/               # /l123-harness:event-review 周审提炼
│   ├── tdd/                        # 执行流的停止条件（红绿循环）
│   └── write-a-skill/              # 「连续成功 3 次 → skill 草稿」的落地工具
└── templates/                      # 装机材料：L1/L2/gate.conf 模板 + 5 个工作模板
```

## 安装

### Claude Code

```bash
# 方式 A：本地开发/单机
claude --plugin-dir /path/to/l123-harness

# 方式 B：个人常驻（放进 skills 目录，自动加载为 l123-harness@skills-dir）
cp -r l123-harness ~/.claude/skills/

# 方式 C：git 仓库分发（本目录即单插件 marketplace）
# 他人执行：
#   /plugin marketplace add <git-repo>
#   /plugin install l123-harness
```

### DeepSeek Harness（dsh）

本仓库同时是标准 **dsh 组合包**（`package.json` 声明 `dsh.bundle` + 根目录
`cordis.patch.yml`），纯 JS 免构建，git 安装无需 pnpm 构建授权：

```bash
dsh plugin --profile web add github:reatcat/l123-harness
```

> 本地开发提示：`dsh plugin add <本地路径>` 走 pnpm `link:`，**不会**安装
> 本插件声明的桥接依赖，hooks 会降级（仅技能可用，启动时告警）。
> 本地验证请用 tarball：`npm pack && dsh plugin --profile web add ./l123-harness-*.tgz`，
> 或在插件目录内先 `pnpm install`。

挂载时自动完成两件事：

1. **技能注册**——4 个方法论技能注册到 `ctx.skills`，经标准 `skill` 工具
   面向模型与用户可用（名称与 Claude Code 下一致）；
2. **hooks 桥接**——挂载官方 `@deepseek-ai/dsh-hooks-claude-code`，
   原样运行 `hooks/hooks.json`（CC/DSH 双宿主同一份钩子脚本）。

| hooks.json 事件 | dsh 桥接 | 说明 |
|---|---|---|
| SessionStart（L2 注入 + 事件） | ✅ | 输出改为 JSON `additionalContext`，双宿主兼容 |
| PreToolUse（gate-guard 门禁） | ✅ | matcher 已含 DSH 的 `edit`/`write`/`str_replace_editor`；exit 2 → deny |
| PostToolUse（tool_error 记录） | ✅ | 纯观察事件 |
| Stop（边界事件） | ✅ | 纯观察事件 |
| PreCompact（压缩抢救） | ⚠️ 桥接未实现 | 配置被安全忽略，该能力在 DSH 暂不生效 |
| SessionEnd（边界事件） | ⚠️ 桥接未实现 | 同上 |

> 注：DSH 上 `init-harness` 生成的骨架目录约定（`CLAUDE.md` / `.agents/`）
> 与 Claude Code 完全一致，两个宿主可共用同一个项目的记忆骨架。

## 使用

```text
/l123-harness:init-harness     # 新项目装机：生成 L1/L2/L3 骨架 + 门禁清单
（日常干活：L2 索引自动注入；门禁自动拦截受保护文件；事件自动记录）
/l123-harness:event-review     # 周审：读事件日志 → 候选进 inbox → 陪同分流
```

DSH 下同名技能经 `skill` 工具或用户命令调用（`init-harness`、`event-review`、
`tdd`、`write-a-skill`），日常自动化部分（L2 注入、门禁、事件记录）由 hooks
桥接在对应生命周期点自动运行。

## 纪律速查

- 改受保护文件：先向用户说明 → 批准 → `touch <项目根>/.claude/.gate-token` → 重试。
- `.agents/inbox/` 干活时不得读取；候选不是结论。
- `.agents/events/` 只读不改，不可变。
- 知识升级路径：context → memory（随手）→ inbox（周审）→ knowledge / L2（人批）。

## 许可

MIT
