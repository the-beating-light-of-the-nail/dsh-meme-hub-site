# dsh-multi-candidate 🐋

**多候选模式插件（test-time scaling）**：让 DeepSeek Harness 对同一任务并行生成多个独立候选方案，再用验证者选优——用更多推理算力换取成功率（"跑 N 遍交最好的一份"）。

## 功能

- **🐋 悬浮球面板**：可自由拖动（位置记忆），点击开/关面板
- **纯配置、零操作**：勾选启用后，直接在输入框正常说任务即可，模型自动按多候选流水线执行——无需特殊指令前缀、无需复制粘贴
- **配置项**：启用开关、候选数（2-5）、第二意见复核（多声音合议）、验证标准（选填）
- **仅当前会话生效**：开启时绑定当前会话，新会话默认关闭，不跨会话泄漏
- **硬接线工具 `multi_candidate_run`**：模型显式触发入口，参数化调用

## 要求

- DeepSeek Harness **rc.8 及以上**（依赖新版 `defineTool` API：`execute`/`output`/裸属性表）
- web profile（客户端面板运行于 Web GUI）
- 宿主已提供 peer 依赖：`@deepseek-ai/dsh-tools`、`dsh-settings`、`dsh-system-prompt`、`schemastery`、`cordis`（均 optional，宿主自带）

## 安装

```bash
# 从 npm（如已发布）
dsh plugin --profile web add dsh-multi-candidate

# 从本地 tarball
dsh plugin --profile web add file:/path/to/dsh-multi-candidate-1.1.0.tgz

# 从本地目录（开发）
dsh plugin --profile web add file:/path/to/dsh-multi-candidate
```

安装后**重启 DSH**，Web GUI 右下角出现 🐋 按钮。

## 使用

1. 点右下角 🐋 打开面板
2. 勾选「启用多候选模式（仅当前会话）」，可选候选数（默认 3）、第二意见、验证标准
3. 在主输入框**正常输入任务**（如"帮我写一个 Python 猜数字游戏"）
4. 模型自动执行：**并行 N 候选 → 验证者选优 →（可选第二意见）→ 汇报**

执行时自动尊重当前会话模式（router / J-space / Anchored 等）。

## 工作原理

```
🐋 面板（客户端）→ settingsScope.set() → 服务端 settings 持久化
        ↓
systemPrompt.section 动态注入（仅对绑定会话）→ 模型上下文自动带配置
        ↓
任务正常输入 → 模型按配置调用 workflow 工具执行「并行候选→验证选优」
```

## 给开发者的注意

- `file:` 安装是**复制模式**：修改源码后需 `remove + add` 重装，或手动同步到 profile 的 `node_modules`（pnpm 缓存不自动刷新）
- 服务端改动必须重启 DSH；仅客户端改动刷新页面即可
- 多候选的最终执行依赖 agent 层的 `workflow` 工具（服务端工具无法直接编排子代理，这是架构边界）

## License

MIT
