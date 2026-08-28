# dsh-kubectl

**Kubernetes (kubectl) 的 DeepSeek Harness (dsh) 插件** —— 让 dsh 智能体检查集群、查资源、
读日志、端口转发、执行一次性命令。只读命令输出 **JSON 结构化数据**（模型解析可靠），写操作显式确认。

> 独立社区项目，非官方。基于 [kubernetes/kubectl](https://github.com/kubernetes/kubectl)（Apache-2.0）。

## 为什么值得做

Kubernetes（40k+ star）**至今没有 DSH 适配插件**。kubectl 的 `-o json` 结构化输出对 agent
极其友好（远胜 winget 的表格），是运维刚需：

| 能力 | 说明 |
|---|---|
| `kubectl_get` | 查资源，`-o json` 结构化输出 |
| `kubectl_describe` / `kubectl_logs` | 排障三件套 |
| `kubectl_status` | 版本/上下文/集群信息 |
| `kubectl_exec` / `kubectl_apply` / `kubectl_delete` | 执行/部署/删除（显式确认） |
| `kubectl_port_forward` | 本地访问集群内服务 |

## 前置要求

- DeepSeek Harness（dsh）
- kubectl 已安装并配置 kubeconfig（`kubectl config get-contexts` 可看）

## 安装

```yaml
- insert:
    - id: kubectl
      name: './src/index.js'
      config:
        kubectlPath: kubectl
        context: my-cluster
        namespace: default
```

```bash
pnpm dsh web --patch ./dsh-kubectl/cordis.patch.yml
```

## 工具

| 工具 | 行为 | 安全 |
|---|---|---|
| `kubectl_get` | 查资源（JSON） | 🔵 只读 |
| `kubectl_describe` | 资源详情 | 🔵 只读 |
| `kubectl_logs` | pod 日志（tail/previous/container） | 🔵 只读 |
| `kubectl_status` | 版本/上下文 | 🔵 只读 |
| `kubectl_exec` | 容器内执行命令 | 🟡 确认 |
| `kubectl_apply` | 应用清单 | 🔴 确认 |
| `kubectl_delete` | 删除资源 | 🔴 确认 |
| `kubectl_port_forward` | 端口转发 | 🟡 常驻 |

## 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `kubectlPath` | `kubectl` | kubectl 路径 |
| `context` | — | 默认上下文 |
| `namespace` | — | 默认命名空间 |
| `timeoutMs` | `60000` | 单次调用超时 |

## 已知限制

- 无集群时命令报连接拒绝（stderr 原样返回）
- `port-forward` 是常驻进程，当前版本不自动停止
- 写操作依赖用户确认；SKILL.md 有明确红线

## 目录结构

```
dsh-kubectl/
  src/index.js            # 8 个工具 + 配置
  skills/kubectl/SKILL.md
  docs/
  cordis.patch.yml
```

## 许可

MIT。
