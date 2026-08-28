# dsh-readcache

⚡ **给 DSH `read` 工具的版本令牌校验结果缓存。**

长会话会反复重读未变更的文件——上下文压缩后的恢复、并行子代理、编辑前后的对比，每一次重复都要重新做文件 I/O 和行号渲染，读到的却是字节完全相同的内容。`dsh-readcache` 包装了 `tools/execute` 事件瀑布，让这些重复读取直接命中进程内缓存，**且每一次命中都对照文件系统自己的版本令牌重新校验**。

## 为什么它是安全的

朴素的缓存会吐旧内容，这个插件不会：

| 性质 | 机制 |
|---|---|
| **绝不吐旧内容** | 每次命中都重新 stat 文件，要求版本令牌精确匹配（本地后端为 `dev:ino:size:mtimeNs:ctimeNs`）。任何写路径——`edit`/`write` 工具、`bash`、外部编辑器——都会改变令牌并立即失效对应条目。 |
| **无写入竞态** | 未命中时，执行结果只有在二次 stat 仍报告执行前令牌的情况下才会入缓存（双 stat 防护）。 |
| **保留"先读后改"约束** | 缓存键包含代理 id。文件系统的观察门（fs-observation-policy）要求每个代理编辑前必须自己读过该文件；按代理隔离键值保证每次命中都以该代理自己的先前观察为凭据。 |
| **内存有界** | LRU 上限：300 条 / 总量 16 MiB / 单条 4 MiB。 |

只有 `read` 工具的成功、非中止、可无损 JSON 序列化的结果才会入缓存；失败结果原样透传。

## `readcache` 工具

插件注册一个模型可见的工具：

- `readcache`（action：`"stats"` | `"clear"`）— 汇报命中/未命中等计数与已节省字符数、条目数；或清空缓存。

stats 输出示例：

```json
{
  "hits": 2,
  "misses": 4,
  "hitRatio": 33.3,
  "stale": 1,
  "stores": 4,
  "evictions": 0,
  "savedChars": 1210,
  "clearedEntries": 0,
  "entries": 3,
  "cachedChars": 1662,
  "maxEntries": 300
}
```

## 安装

```bash
dsh plugin --profile web add dsh-readcache
```

或从本地检出安装：

```bash
cd dsh-readcache && npm pack
dsh plugin --profile web add ../dsh-readcache/dsh-readcache-1.0.1.tgz
```

安装后重启 DeepSeek Harness 生效。

## 设计说明

- **拦截点**：`tools/execute` 的 around 分发瀑布——官方超时策略用的同一条缝。调用身份保持不变，只有结果被复用。
- **声明 `inject`，不和加载器赛跑**：插件导出 `inject = ["fs", "tools"]`，Cordis 会把它保持在等待态，直到基础 bundle 提供这两个服务。若用软性 `ctx.get("fs")` 提前返回，可能在启动竞态中抢跑并让整个缓存静默失效——这正是 1.0.1 修复的 bug。
- **为什么用 stat 而不是 fs 观察事件**：`fs.stat` 是无副作用的纯探测；观察事件依赖触发顺序，且命中时无法复核。
- **仅宿主侧**：缓存完全活在宿主进程里。客户端仪表盘（经 Remote service）在 v1.1 路线图上。
- 入缓存的对象是冻结的 `ToolExecutionResult`；一次无损 JSON 往返（`JSON.parse(JSON.stringify(...))`）保证存下的副本不持有任何指向运行时的活引用。

## 已验证行为

- 同参数重读未变更文件 → `hits +1`，省掉 I/O。
- 两次读取之间文件被外部修改 → 返回新内容（不吐旧内容），`stale +1`。
- 另一个代理首次读取已缓存文件 → `misses +1`（按代理隔离成立）。

## 许可证

MIT
