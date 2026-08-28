# dsh-k6

# dsh-k6

**Grafana k6 的 DeepSeek Harness 插件** —— 让 dsh 智能体编写、运行和分析负载测试。

> 独立社区项目，非官方。基于 [grafana/k6](https://github.com/grafana/k6)（AGPL-3.0）。

## 特性

- 4 个原生工具：`k6_version` / `k6_run` / `k6_scenarios` / `k6_smoke`
- 冒烟测试（1 VU 1 iter）先验证脚本，再跑真实负载
- `--summary-export` JSON 输出，模型可读 p95/p99/错误率
- 最轻量的 CLI 包装（单命令 + 脚本），模式最易复用

## 安装

```yaml
- insert:
    - id: k6
      name: './src/index.js'
      config:
        k6Path: k6
        timeoutMs: 300000
```

## 许可

MIT。
