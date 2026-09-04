# dsh-messages-sanitizer

[![English](https://img.shields.io/badge/English-README.en.md-2ea44f)](./README.en.md)

> **🔧 你在 DeepSeek Harness 里创建 / 加载插件，对话崩了吗？本插件专治这个。**
>
> 开发或加载本地插件时，一次工具调度崩溃（`Cannot read properties of undefined
> (reading 'prepare')`）就会在会话里留下孤儿 `tool_calls`，之后**每一轮**都被
> `400 INVALID_REQUEST` 拒绝、重试无效、会话卡死。**本插件自动把 messages 数组修回
> 合法，让对话继续，不再卡死。**

```
💥 Before                                ✅ After (安装本插件后)
插件崩溃                                  插件崩溃
   ↓                                        ↓
留下孤儿 tool_calls                       messages 自动修复
   ↓                                        ↓
400 INVALID_REQUEST 死循环                对话继续
   ↓
对话卡死
```

DeepSeek Harness 消息数组自动矫正插件：**防止一切因 messages 数组不合法导致的聊天崩溃**。

## 背景：你遇到的那个崩溃

OpenAI 兼容协议要求工具调用成对出现，且 tool 消息必须**紧邻**其 assistant
tool_calls 消息（中间不能插入任何 user / assistant 消息）：

```
assistant  { content: ..., tool_calls: [{ id: "call_A", ... }] }
tool       { tool_call_id: "call_A", ... }   ← 必须紧跟覆盖每个 id
```

当一次工具调度在「记录 assistant tool_calls / tool/call 之后、产出 tool 结果之前」
崩溃时（例如 `ctx.tools[symbol].prepare` 抛 `Cannot read properties of undefined`），
会话日志会留下一个**没有 tool 消息响应的孤儿 tool_calls**。下一轮请求把历史拼成：

```
[..., assistant{tool_calls:[write]}, user{...}]        ← 非法
```

API 直接返回 `400 INVALID_REQUEST`，且重试时历史原封不动，反复被拒，会话卡死。
如果崩溃后还有多次失败重试，日志里还会留下**多条重复的 user 消息**横在孤儿
assistant 与注入点之间，让"补插 tool 消息"也无法满足紧邻约束。

## 背景（与 DSH 官方讨论对照）

同类故障在 DeepSeek Harness 官方仓库也已被跟踪：
[Discussion #4843「残缺或孤立的 tool_calls 记录导致 DeepSeek 接口返回 400」](https://github.com/deepseek-ai/deepseek-harness/discussions/4843)
描述了「会话历史中存在无配对 result、或 id/name/arguments 残缺的 tool_calls 时，chat-completions 接口返回 400」，
并从 harness 源码层（agent-loop 剥离、llm-deepseek 合成 fallback id、compaction 的 tool-pairing 按 callId 而非计数）
给出根因修复 patch。

本插件与那个修复是**互补而非替代**：它在 DSH 源码里根治；本插件是一个
**不修改 DSH 源码、在运行时自动矫正 messages 数组**的安全网——已中毒的旧会话，
或跑在仍带该 bug / 工具调度崩溃的 harness 版本上的用户，都能被自动救回并继续对话，
而不必等待 harness 发版。

## 插件如何修复（四层防御）

1. **自动续跑（agent/status，主路径）**：工具调度崩溃（如 `prepare` 崩）后，趁
   agent 回到 idle 时，把合成 error tool-result 送回报文箱并唤醒它——**把错误
   原样上报给 LLM，下一步换工具、重试还是向用户报告，由 LLM 自己决定**。这保证
   "AI 消息始终是最后一条、对话不卡死"。

2. **预防（agent/pre-step）**：追踪每个会话中「已声明但从未被 tool/result 响应」的
   调用；下一轮请求构建前把合成 error tool-result 消息插到该步消息最前面（覆盖
   重启后恢复的旧孤儿）。合成消息随 decision.messages 以 `user/message` 事件落盘，
   `deriveMessages()` 从根上恢复合法，**从源头杜绝 400**。

3. **治愈（agent/request-error）**：若 API 仍因 tool_calls 配对/紧邻违规返回 400
   （例如旧版本已污染的会话、或孤儿 assistant 后面已横着过期消息），用 **surface
   替换**完成修复，然后**强制重试一次**（重试基于修复后的日志重建请求，一次成功）：
   - 把悬空 assistant 消息改写成**不含 tool_calls** 的版本（剥离无响应的调用）；
   - 把孤儿 tool 消息（无前置 tool_calls 的 tool-result）**中和**成纯文本 user 消息；
   - **恢复**被误剥但结果仍紧邻的 assistant（还原 tool_calls，保留历史工具上下文）；
   - 折叠崩溃重试留下的**重复 user 消息**。
   修复幂等：第二次遇到同一违规时无事可做，自然回退下游策略，不会无限重试。

4. **兜底（llm/stream）**：对每个请求做纯数组矫正（配对 + 紧邻重排 + 孤儿/重复
   丢弃 + 空 assistant 丢弃）。循环构建的请求是冻结的，只告警不改写；
   compaction、session-title 等自建 messages 的非冻结请求直接原地替换。

## 安装

```bash
dsh plugin --profile web add github:Leeminjing/dsh-messages-sanitizer
```

重启 harness 即生效（插件随 profile 层栈自动加载）。

更新到最新版：

```bash
dsh plugin --profile web update dsh-messages-sanitizer
```

## 配置

| 键 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | 总开关 |

停用方式：删除 cordis.patch.yml 中的插入行，或改为：

```yaml
- insert:
    - id: messages-sanitizer
      name: 'dsh-messages-sanitizer'
      disabled: true
```

## 验证

```bash
cd dsh-messages-sanitizer
node --test        # 40 个用例：纯函数矫正 + 会话追踪 + 请求失败修复 + 真实 cordis/Session 集成
```

测试覆盖（均用真实 `@deepseek-ai/dsh-session` 的 foldSurface / Session 校验）：

- 真实崩溃序列端到端：`assistant/message{tool_calls}` → `tool/call` → 崩溃 →
  `step/end` → `turn/end error` → 下一回合注入后 wire 合法；
- 真实污染日志（孤儿 + 过期重复 user 消息）经修复后纯 user/assistant，无任何
  tool 消息，且修复幂等；
- 真实 Session 上执行 surface 替换（通过 Session 自带校验）；
- 请求失败修复只在 tool_calls 配对 400 时干预、修复后强制重试一次、且不会无限重试。

## 目录结构

```
dsh-messages-sanitizer/
├── package.json      # 声明 dsh.bundle（dsh plugin add 的安装入口）
├── cordis.patch.yml  # bundle 补丁层（挂载 messages-sanitizer）
├── LICENSE
├── README.md
├── README.en.md
├── lib/
│   ├── index.js      # 插件入口（name / inject / Config / apply）
│   ├── sanitize.js   # 纯函数消息数组矫正器（配对/紧邻/孤儿/重复/空消息）
│   └── repair.js     # 孤儿追踪 + 预步预防 + surface 替换治愈 + 请求失败强制重试
└── tests/
    ├── sanitize.test.mjs            # 纯函数矫正用例
    ├── repair.test.mjs              # 追踪器 + 预步修复 + 请求失败修复（假 ctx）
    ├── integration.test.mjs         # 真实崩溃序列端到端模拟
    ├── heal.test.mjs                # 治愈路径：正常回合不误判 / 孤儿中和 / 误剥恢复
    └── cordis-integration.test.mjs  # 真实 cordis + 真实 Session 集成
```

## 说明

- 插件是零构建的纯 ESM，直接可被 cordis 加载器加载；运行期依赖
  `@deepseek-ai/dsh-llm`（合成消息）、`@deepseek-ai/dsh-session`（surface 折叠）、
  `@deepseek-ai/cordis`、`@deepseek-ai/schemastery`（配置 schema），与 harness 运行时同源。
- 已崩溃的旧会话在重启后继续聊天时，会被**治愈路径**自动修复（第一次请求失败时
  自动剥离悬空调用并重试成功）。
- 本目录下的 `node_modules` 是一个指向 harness 运行时 `~/.dsh/profiles/node_modules`
  的 junction，仅为本地 `node --test` 提供依赖解析；harness 运行期不依赖它。
- 修改插件代码后无需重新构建；**重启 harness**（或让 cordis HMR 重载）即生效。
