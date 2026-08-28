# dsh-healthcheck

DeepSeek Harness 环境体检插件：一个 `health_check` 工具，只读体检你的 dsh 环境，产出分级报告（CRITICAL / WARNING / INFO），并对比上次体检的趋势。

融入 [sys-doctor](https://github.com/taxueseek/pc-guardian) 的体检方法论（指标快照 + 历史基线 + 趋势对比 + 大目录定位），并针对 dsh 环境增加专属体检项。

## 体检项

| 类别 | 内容 | 分级 |
| --- | --- | --- |
| 磁盘 | APFS 数据卷使用率（`/System/Volumes/Data`，避免系统卷误导） | ≥90% CRITICAL / ≥80% WARNING |
| 磁盘趋势 | 对比上次体检的已用增量（GB） | 增量 >5GB WARNING |
| 内存 | macOS 内存压力（vm_stat 换算） | ≥80% WARNING |
| 网络 | ping 8.8.8.8 平均延迟 | ≥150ms WARNING |
| ~/.dsh 膨胀 | clipboard 图片、sessions、profiles、storages 各目录大小 | ≥1GB WARNING |
| 插件版本 | 对比 npm registry 最新版 | 有新版 INFO |
| 工具链 | brew/npm/pnpm/node/python3/git/gh/zstd 可用性 | 缺失 INFO |

**只读设计**：只体检和报告，绝不自动删除任何东西。清理动作由模型根据报告建议、你确认后执行。

## 数据

- 历史基线：`~/.dsh/health/history.jsonl`（每次体检追加一条，保留最近 200 条）
- 首次体检即建立基线，下次自动对比趋势

## 安装

```sh
dsh plugin --profile web add "github:taxueseek/dsh-healthcheck#main&path:."
# 重启 dsh web
```

（本地开发：`dsh plugin --profile web add /path/to/dsh-healthcheck`）

## 用法（模型视角）

用户说「体检一下」「看看磁盘」「环境是不是有问题」→ 模型调用 `health_check`，返回分级报告：

```
# 环境体检报告
总体: HEALTHY | CRITICAL 0 / WARNING 0 / INFO 4
- [INFO] 磁盘使用率 62.5%，可用 285.3 GB
- [INFO] 内存压力 34.2%
- [INFO] 网络延迟 18 ms
~/.dsh 数据目录:
  1.2 GB  ~/.dsh/sessions
插件版本:
  dsh-context: 0.5.0 → 0.7.3（可升级）
```

## 配置

```yaml
- id: healthcheck-toolkit
  name: 'dsh-healthcheck'
  config:
    stateDir: '~/.dsh/health'    # 历史基线目录
    historyLimit: 200            # 保留快照条数
    diskWarnPct: 80              # 磁盘 WARNING 阈值（%）
    diskCriticalPct: 90          # 磁盘 CRITICAL 阈值（%）
    memoryWarnPct: 80            # 内存压力 WARNING 阈值（%）
    latencyWarnMs: 150           # 延迟 WARNING 阈值（ms）
    scanTimeoutMs: 30000         # 单次扫描超时
```

## 开发

```sh
npm install --include=dev
npm test          # node --test 单元测试
npm run build     # tsc 编译
```

## 许可

MIT

## 安装

\`\`\`sh
dsh plugin --profile web add taxueseek/dsh-healthcheck
\`\`\`

## 贡献

欢迎提交 PR。
