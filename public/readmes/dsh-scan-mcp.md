# dsh-scan-mcp

![dsh-scan-mcp banner](https://raw.githubusercontent.com/chenbin-dev/dsh-scan-mcp/5010ce4df9e96841dfb61701e4683e09a35e536a/assets/dsh-scan-mcp-banner.svg)

[![npm version](https://img.shields.io/npm/v/dsh-scan-mcp.svg)](https://www.npmjs.com/package/dsh-scan-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-scan-mcp.svg)](https://www.npmjs.com/package/dsh-scan-mcp)
[![license](https://img.shields.io/npm/l/dsh-scan-mcp.svg)](LICENSE)

**Windows MCP Hub for DeepSeek Harness** — scans the MCP servers configured in your local coding agents
(Claude Code / Codex / CodeBuddy), probes **real connectivity** with an actual MCP `initialize` handshake
(both **stdio** and **streamable-http** transports), and lets you enable/disable each server from the UI.

[中文文档](./README.zh.md) · [npm](https://www.npmjs.com/package/dsh-scan-mcp) · [GitHub](https://github.com/chenbin-dev/dsh-scan-mcp)

## Features

- **Auto-scan** — reads MCP configs from Claude Code (`~/.claude.json`), Codex (`~/.codex/config.toml`)
  and CodeBuddy (`~/.codebuddy/mcp.json`), with cross-agent deduplication (same MCP shown once, sources merged).
- **Real connectivity probe** — starts the actual process (stdio) or performs a real MCP `initialize`
  handshake over HTTP (streamable-http, JSON **and** SSE responses, configurable `headers` passthrough).
  Online (green) / offline (red) at a glance, with the concrete failure reason and latency.
- **Enabled-only probing** — **only enabled MCPs are ever connected**. Disabled servers show as offline
  (`已停用（未启用，不检测连接）`) and are never probed; re-enabling auto re-tests.
- **Per-server reconnect** — re-test one server without a full rescan (disabled servers: button greyed out).
- **Sliding toggles** — all servers enabled by default; toggle any off/on. State persists to
  `~/.dsh/dsh-scan-mcp.json` (survives restarts).
- **`/mcp` popup panel** — type `/mcp` in any session to open a modal control panel (not an AI reply).
- **Settings section** — Settings → Windows MCP 控制中心 (card layout).
- **Model tool** — exposes `mcp_discovered_catalog` (scan + connectivity, read-only).

## Requirements

- Windows (the scanned agent configs live under the Windows user home)
- DeepSeek Harness (DSH) with a **web** profile (`dsh web`)
- Node.js ≥ 20 (the host half uses the built-in `fetch` for streamable-http probes)

## Installation

Pick **one** of the following commands (replace `<profile-name>` with your DSH profile name, e.g. `web`):

```bash
# 1. From npm (recommended)
dsh plugin --profile <profile-name> add dsh-scan-mcp

# 2. From GitHub
dsh plugin --profile <profile-name> add https://github.com/chenbin-dev/dsh-scan-mcp.git

# 3. Local development
dsh plugin --profile <profile-name> add /path/to/dsh-scan-mcp
```

Then **restart the profile** (e.g. stop and run `dsh web` again). The plugin is a static bundle:
it survives DSH restarts and needs no per-session approval prompt.

## Usage

1. In any session, type **`/mcp`** → the MCP control panel pops up:
   - Summary row: deduped MCP count · online · offline · disabled · diagnostics
   - Each row: name, transport (`stdio` / `streamable-http`) · endpoint, ● online / ● offline,
     failure reason, **Reconnect** button (greyed out when disabled), sliding toggle
   - Header: refresh scan / close
2. Or open **Settings → Windows MCP 控制中心** for the same data in card layout.
3. The model can also call the `mcp_discovered_catalog` tool for the full catalog.

## Scan sources

| Agent | Config file | Format |
|---|---|---|
| Claude Code | `~/.claude.json` | JSON `mcpServers` object |
| Codex | `~/.codex/config.toml` | TOML `[mcp_servers.<name>]` sections |
| CodeBuddy | `~/.codebuddy/mcp.json` | JSON |

Missing/unreadable files show up in the panel's **diagnostics** counter and don't break the rest of the scan.
Want more sources? Edit the `SOURCES` array at the top of `src/index.js` (or open a PR / an issue).

## Transport support

- **stdio** — spawns `command` with `args` (plus `env`), sends `initialize` over stdin, waits for the
  JSON-RPC response on stdout.
- **streamable-http** — `POST` `initialize` to `url` with
  `Content-Type: application/json` and `Accept: application/json, text/event-stream`;
  parses both plain JSON and SSE (`data:` line) responses; forwards the config's `headers`
  (e.g. `Authorization`) verbatim.

## Privacy & Security

- The plugin only ever shows **environment variable / header NAMES** — it never reads or displays
  credential values; tokens stay in your original agent configs.
- Probing is a handshake only (`initialize`): no MCP tools are ever invoked, no MCP process is left
  running (each probe is terminated when done), and **disabled servers are never probed at all**.
- The state file `~/.dsh/dsh-scan-mcp.json` stores only MCP ids and their toggle state — no credentials.

## Troubleshooting

**A server stays offline?** Click **Reconnect** on its row to see the exact reason:

- `ERR_MODULE_NOT_FOUND` — usually a corrupted npm/npx cache. Run `npm cache clean --force`
  (or delete the offending directory under `%LocalAppData%\npm-cache\_npx\<hash>`), then reconnect.
- `npm ... 404` — the package name does not exist; fix it in your agent config (e.g. sequential-thinking
  is `@modelcontextprotocol/server-sequential-thinking`).
- `连接超时` (stdio) — the process did not answer `initialize` within 20s (common when network/proxy
  is required).
- `HTTP 状态 404/405（该地址可能不是 MCP 端点）` — the `url` is not an MCP endpoint or the server
  does not implement MCP.
- `网络不可达 / 连接超时` (streamable-http) — cannot reach the endpoint; check network/proxy.
- `未识别到 MCP initialize 响应` — non-JSON/SSE reply; the endpoint may need a `headers` auth field.

## Development

```
dsh-scan-mcp/
├── package.json        # plugin metadata (dsh.bundle.patch / dsh.client)
├── cordis.patch.yml    # bundle patch — inserts the plugin row (id: wmcp)
└── src/
    ├── index.js        # Host half: scan + handshake probes + HTTP RPC + tool + /mcp command
    └── client.js       # Client half (browser): settings page + popup panel + command trigger
```

- Host half is a plain ESM module (`export { name, inject, apply }`) using Node built-ins only
  (`child_process`, `fs`, `fetch`); peer dependency `@deepseek-ai/dsh-tools` is provided by the host.
- Host ↔ Client talk over HTTP RPC: `POST /__scan-mcp/scan|test|setEnabled`.
- Probe results are cached 30s; up to 3 concurrent probes; 20s stdio / 12s HTTP timeouts.
- Syntax check: `node --check src/index.js && node --check src/client.js` (`npm test`).

## License

[MIT](./LICENSE)
