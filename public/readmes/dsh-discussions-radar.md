# dsh-discussions-radar

[![npm](https://img.shields.io/npm/v/dsh-discussions-radar.svg)](https://www.npmjs.com/package/dsh-discussions-radar)

[![CI](https://github.com/zoahdev/dsh-discussions-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/zoahdev/dsh-discussions-radar/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-verified-blue)](https://github.com/topics/dsh-plugin)

Official GitHub Discussions radar for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh): list, filter and search the official discussion boards — Ideas / Q&A / Show Your Plugins! / General / Announcements / Polls — from inside dsh or the terminal.

The companion to [dsh-github-release-radar](https://github.com/zoahdev/dsh-github-release-radar): that one watches releases, this one watches the community pulse. Zero runtime dependencies, read-only, public API only.

## Install

```sh
dsh plugin add dsh-discussions-radar
```

Or run standalone:

```sh
npx dsh-discussions-radar --category "Show Your Plugins!" --limit 10
```

## CLI

```sh
dsh-discussions-radar [options]

  --repo <owner/repo>   repository to scan (default deepseek-ai/deepseek-harness)
  --category <name>     filter by exact category (Ideas / Q&A / Show Your Plugins! / General / Announcements / Polls)
  --query <keyword>     case-insensitive keyword filter on title
  --limit <n>           max results (default 10)
  --since <ISO>         only discussions updated at/after this date
  --json                print the machine-readable dsh-discussions-radar/v1 report
  --help                show this help
```

Exit codes: `0` results, `1` no results / warnings, `2` usage/IO error.

```sh
npx dsh-discussions-radar
npx dsh-discussions-radar --category Ideas --limit 5
npx dsh-discussions-radar --query "plugin" --since 2026-08-01 --json
```

## In-harness usage (agent-callable)

Ask your dsh agent:

> 官方社区最近有什么新讨论？`discussions_radar`，按更新时间排一下。
> What's new in the official community? Run `discussions_radar` sorted by activity.

The tool returns a `dsh-discussions-radar/v1` report:

```json
{
  "schema": "dsh-discussions-radar/v1",
  "repo": "deepseek-ai/deepseek-harness",
  "ok": true,
  "count": 10,
  "items": [
    {
      "number": 3123,
      "title": "Four new verified plugins: ...",
      "category": "Show Your Plugins!",
      "comments": 1,
      "createdAt": "2026-08-18T00:00:00Z",
      "updatedAt": "2026-08-18T12:00:00Z",
      "url": "https://github.com/deepseek-ai/deepseek-harness/discussions/3123"
    }
  ],
  "warnings": [],
  "fetchedAt": "2026-08-18T12:05:00Z"
}
```

## Why it exists

- The official repo is Discussions-only (no issues); the community pulse lives in these boards, but no dsh plugin surfaced them to the agent.
- Staying on top of Ideas / Q&A / Show Your Plugins is how plugin authors find gaps and users find answers.
- Zero runtime dependencies, read-only, works without any API key (public GitHub REST API).

## Development

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI runs the dsh-plugin-doctor preflight, unit tests, a packed-artifact integration that calls the real public GitHub API, and a fresh-profile `dsh web` boot smoke on Windows.

## License

MIT © 2026 zoahdev

---

# dsh-discussions-radar（中文）

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）官方 GitHub Discussions 雷达：在 dsh 里或终端里列出、筛选、搜索官方讨论区——Ideas / Q&A / Show Your Plugins! / General / Announcements / Polls。

与 [dsh-github-release-radar](https://github.com/zoahdev/dsh-github-release-radar) 互补：那个看版本发布，这个看社区脉搏。零运行时依赖、只读、只用公开 API。

## 安装

```sh
dsh plugin add dsh-discussions-radar
```

独立使用：

```sh
npx dsh-discussions-radar --category "Show Your Plugins!" --limit 10
```

## CLI

```sh
dsh-discussions-radar [options]

  --repo <owner/repo>   要扫描的仓库（默认 deepseek-ai/deepseek-harness）
  --category <name>     按精确分类过滤（Ideas / Q&A / Show Your Plugins! / General / Announcements / Polls）
  --query <keyword>     标题关键词过滤（不区分大小写）
  --limit <n>           最大条数（默认 10）
  --since <ISO>         只显示该时间后更新过的讨论
  --json                输出机器可读 dsh-discussions-radar/v1 报告
  --help                帮助
```

退出码：`0` 有结果，`1` 无结果/有警告，`2` 用法/IO 错误。

```sh
npx dsh-discussions-radar
npx dsh-discussions-radar --category Ideas --limit 5
npx dsh-discussions-radar --query "plugin" --since 2026-08-01 --json
```

## 在 harness 内使用（agent 可调用）

对 agent 说：

> 官方社区最近有什么新讨论？`discussions_radar`，按更新时间排一下。

工具返回 `dsh-discussions-radar/v1` 报告（结构见英文版 JSON 示例）。

## 为什么需要它

- 官方仓库只用 Discussions（没有 issues）；社区脉搏就在这些板块里，但之前没有 dsh 插件把它暴露给 agent。
- 跟踪 Ideas / Q&A / Show Your Plugins 是插件作者发现空位、用户找到答案的方式。
- 零运行时依赖、只读、无需任何 API key（公开 GitHub REST API）。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

CI 跑 dsh-plugin-doctor 预检、单元测试、调用真实公开 GitHub API 的打包集成、以及 Windows 全新 profile 的 `dsh web` 启动冒烟。

## 许可证

MIT © 2026 zoahdev
## Related ecosystem tools

- [dsh-dep-audit](https://github.com/zoahdev/dsh-dep-audit) - dependency supply-chain hygiene
- [dsh-quality-score](https://github.com/zoahdev/dsh-quality-score) - plugin quality scorecard + full-registry leaderboard
- [dsh-ecosystem](https://github.com/zoahdev/dsh-ecosystem) - health scan, impact, trend, live dashboard
- [dsh-tutorials](https://github.com/zoahdev/dsh-tutorials) - bilingual plugin pipeline tutorials
## FAQ

- **How do I install?** dsh plugin add dsh-discussions-radar or run the CLI directly (see README).
- **Does it need an API key?** No.
- **Is it read-only?** Yes by default; any write/apply is an explicit flag.
## Examples

See the README for full CLI usage. Quick start:

```sh
npx dsh-discussions-radar --help
```

