# dsh-disk-audit

[![npm](https://img.shields.io/npm/v/dsh-disk-audit.svg)](https://www.npmjs.com/package/dsh-disk-audit)

[![CI](https://github.com/zoahdev/dsh-disk-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/zoahdev/dsh-disk-audit/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-verified-blue)](https://github.com/topics/dsh-plugin)

Disk-usage audit for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) data directories: **total size, per-directory breakdown, largest directories, oversized files and cleanup suggestions**.

Session logs can grow to hundreds of megabytes (the ecosystem has even seen the ~512 MB stringify cap). This plugin tells you where the space went before it becomes a problem. Zero runtime dependencies, read-only.

## Install

```sh
dsh plugin add dsh-disk-audit
```

Or run standalone:

```sh
npx dsh-disk-audit ~/.dsh
```

## CLI

```sh
dsh-disk-audit [dir] [options]

  --json                   print the machine-readable dsh-disk-audit/v1 report
  --large-file <bytes>     warn threshold per file (default 104857600 = 100 MB)
  --skip-node-modules      do not descend into node_modules trees
  --help                   show this help
```

Exit codes: `0` clean, `1` warnings (oversized files / total above threshold), `2` usage/IO error.

```sh
npx dsh-disk-audit ~/.dsh
npx dsh-disk-audit ~/.dsh --json --large-file 52428800
```

## In-harness usage (agent-callable)

Ask your dsh agent:

> 看看我的 dsh 数据目录占了多少磁盘，最大的文件是哪些。
> Audit disk usage of my dsh data directory: `disk_audit`.

The tool returns a `dsh-disk-audit/v1` report:

```json
{
  "schema": "dsh-disk-audit/v1",
  "target": "~/.dsh",
  "ok": false,
  "totalBytes": 157286400,
  "totalFiles": 1842,
  "dirs": [ { "dir": "~/.dsh/sessions", "sizeBytes": 146800640, "files": 42 } ],
  "largestFiles": [ { "path": "~/.dsh/sessions/big.jsonl", "sizeBytes": 134217728 } ],
  "warnings": ["1 file(s) at or above 100 MB"],
  "suggestions": ["Export/compress the largest session logs before they hit the stringify cap"]
}
```

## Why it exists

- Session logs are append-only and can silently eat gigabytes; no other plugin reports disk usage by directory.
- Catching a 500 MB session log before it hits the stringify cap is a lot cheaper than recovering after.
- Zero runtime dependencies, read-only by construction — it never deletes or moves anything.

## Development

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI runs the dsh-plugin-doctor preflight, unit tests, packed-artifact integration (real `disk_audit` invocation), and a fresh-profile `dsh web` boot smoke on Windows.

## License

MIT © 2026 zoahdev

---

# dsh-disk-audit（中文）

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）数据目录的**磁盘占用审计**：总大小、按目录拆分、最大目录、超大文件与清理建议。

会话日志是追加式的，能悄悄涨到几百 MB（社区甚至见过 ~512 MB 的 stringify 上限）。本插件在你遇到问题前先告诉你空间去哪了。零运行时依赖、只读。

## 安装

```sh
dsh plugin add dsh-disk-audit
```

独立使用：

```sh
npx dsh-disk-audit ~/.dsh
```

## CLI

```sh
dsh-disk-audit [dir] [options]

  --json                   输出机器可读 dsh-disk-audit/v1 报告
  --large-file <bytes>     单文件告警阈值（默认 104857600 = 100 MB）
  --skip-node-modules      不进入 node_modules 树
  --help                   帮助
```

退出码：`0` 干净，`1` 有警告（超大文件 / 总量超阈值），`2` 用法/IO 错误。

```sh
npx dsh-disk-audit ~/.dsh
npx dsh-disk-audit ~/.dsh --json --large-file 52428800
```

## 在 harness 内使用（agent 可调用）

对 agent 说：

> 看看我的 dsh 数据目录占了多少磁盘，最大的文件是哪些。

工具返回 `dsh-disk-audit/v1` 报告（结构见英文版 JSON 示例）。

## 为什么需要它

- 会话日志追加式增长，能悄悄吃掉几个 GB；没有其他插件按目录报告磁盘占用。
- 在 500 MB 会话日志撞上 stringify 上限之前发现它，比事后恢复便宜得多。
- 零运行时依赖、天然只读——永不删除或移动任何东西。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI 跑 dsh-plugin-doctor 预检、单元测试、打包集成（真实 `disk_audit` 调用）、Windows 全新 profile 的 `dsh web` 启动冒烟。

## 许可证

MIT © 2026 zoahdev
## Related ecosystem tools

- [dsh-dep-audit](https://github.com/zoahdev/dsh-dep-audit) - dependency supply-chain hygiene
- [dsh-quality-score](https://github.com/zoahdev/dsh-quality-score) - plugin quality scorecard + full-registry leaderboard
- [dsh-ecosystem](https://github.com/zoahdev/dsh-ecosystem) - health scan, impact, trend, live dashboard
- [dsh-tutorials](https://github.com/zoahdev/dsh-tutorials) - bilingual plugin pipeline tutorials
## FAQ

- **How do I install?** dsh plugin add dsh-disk-audit or run the CLI directly (see README).
- **Does it need an API key?** No.
- **Is it read-only?** Yes by default; any write/apply is an explicit flag.
## Examples

See the README for full CLI usage. Quick start:

```sh
npx dsh-disk-audit --help
```

