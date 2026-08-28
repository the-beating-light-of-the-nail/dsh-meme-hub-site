# dsh-proxy-routing

English | [中文](README.zh.md)

A DeepSeek Harness egress-routing plugin that connects to an **already running** HTTP or SOCKS5 proxy in the environment, routing shell commands and LLM provider traffic per execution without mutating the host process environment.

This plugin does not provide proxy functionality. It does not create a proxy service, manage nodes or subscriptions, or implement split-routing rules. An accessible HTTP or SOCKS5 proxy endpoint must already exist before using it.

## Overview

- Connects to an existing local HTTP (including CONNECT) or SOCKS5 proxy.
- Keeps direct connection as the default. `NO_PROXY` excludes loopback addresses and `api.deepseek.com` by default.
- Routes foreground and background Bash/PowerShell subprocesses, including nested `git`, `curl`, `npm`, and `pnpm` commands.
- Applies provider-specific routes to LLM streams while isolating concurrent direct and proxied requests.
- Persists configuration through the official `proxy-routing` settings namespace in `$DSH_HOME/settings.yaml` and applies changes without restarting DSH.
- Requires human approval for enabling or disabling a proxy route (except under the Full Access permission tier).

## Pain Points and Use Cases

### Concrete examples

| Scenario | Direct-connection pain point | What this plugin does |
|---|---|---|
| `gh repo clone`, `git clone` from GitHub | `Failed to connect to github.com port 443: Connection timed out` | After enabling, every `git`/`gh` subprocess the Agent spawns inherits `HTTP(S)_PROXY`; no `~/.gitconfig` or `git config http.proxy` changes |
| `curl`/`wget` downloads of external files | Downloads hang or drop (`connect timed out`) | Command-line subprocesses started by DSH inherit the injected proxy environment for both foreground and background runs |
| Agent installs dependencies with `npm`/`pnpm`/`cargo` | `ETIMEDOUT`, `ESOCKETTIMEDOUT`, interrupted downloads | Dependency-install subprocesses go through the proxy automatically; prefer package mirrors when available |
| LLM provider API domains blocked or rate-limited | Interrupted streaming, provider unreachable | Configure a per-provider proxy route without touching direct traffic |
| `docker pull` image pulls | `dial tcp ... i/o timeout`, `net/http: TLS handshake timeout` | **Not applicable**: the Docker daemon performs image pulls, not this plugin; configure the proxy or a registry mirror in Docker Desktop / the daemon |

### Not applicable

- Docker daemon image pulls and BuildKit-side network traffic.
- Programs that ignore proxy environment variables, such as browsers and WinHTTP/WinINET applications.
- Providing a proxy service: this plugin only connects to a proxy already running in the environment.

## Install

For development or local use, add the plugin directory to the profile's `cordis.patch.yml` using an absolute path:

```yaml
- insert:
    - id: proxy-routing
      name: '/path/to/dsh-proxy-routing'
```

After release:

```bash
dsh plugin --profile web add github:<owner>/dsh-proxy-routing
```

Restart DSH after installation so the plugin can load and register the `net_proxy_*` tools.

## Configuration

### Default state

A new v2 settings namespace resolves to a default structure that works out of the box in direct mode:

- The default Agent route is direct: `bindings.agent.kind = "direct"`.
- The `default` profile includes default `noProxy` and `timeout` values, but no real proxy endpoint.
- `noProxy` defaults to `127.0.0.1`, `localhost`, `::1`, and `api.deepseek.com`.
- `timeout` defaults to `60000` milliseconds.
- The user must provide `protocol`, `host`, and `port` for a network proxy, pointing to a proxy service already running in the environment.
- Existing `proxy-agent.json` files are ignored. This release does not automatically migrate the old private-file format; copy values into the YAML namespace manually if needed.

The plugin therefore works out of the box for direct connections after installation. A user only needs to configure a proxy endpoint when a proxied egress is required.

### Configuration schema

The official DSH settings provider stores this namespace in `$DSH_HOME/settings.yaml` (falling back to `~/.dsh/settings.yaml` when `DSH_HOME` is unset). Other settings namespaces in the same document are preserved. The following YAML is the v2 canonical shape:

```yaml
proxy-routing:
  version: 2
  profiles:
    - id: default
      protocol: http
      host: 127.0.0.1
      port: 7897
      username: ""
      password: ""
      noProxy: [127.0.0.1, localhost, ::1, api.deepseek.com]
      timeout: 60000
  bindings:
    agent:
      kind: direct
      # A profile route also requires: profileId: default
    providers: []
    gateway: null
    gatewayPurposes: []
  gateway:
    enabled: false
    port: 17890
    dedicatedPurposePorts: false
    purposes: []
```

`protocol`, `host`, and `port` must point to a proxy service that is already running in the environment. The namespace is registered through `ctx.settings`; the official settings-file provider owns YAML parsing, atomic writes, locking, and hot reload. The plugin does not read, write, watch, or migrate `proxy-agent.json`.

Fixed guidance for an unconfigured endpoint:

> 代理端点未配置：请运行 `net_proxy_enable` 并提供 `protocol`/`host`/`port`，或在 Web 设置（Settings → Network Proxy）中配置代理地址。

## Agent Installation Guide

The Agent only discovers and requests use of an existing proxy; it does not start a proxy service. Recommended flow:

1. Confirm that an accessible HTTP or SOCKS5 proxy already exists and obtain its `protocol`, `host`, and `port`.
2. When an external request, fetch, or download fails, call `net_proxy_status` and check whether `default` is configured.
3. Call `net_proxy_probe` to test the current or temporary endpoint. Do not invent an address when no endpoint is configured.
4. Request `net_proxy_enable` with the endpoint details. Under Full Access it takes effect immediately; under lower tiers, wait for human approval before retrying.
5. Request `net_proxy_disable` when direct routing should be restored. Explicit provider overrides are retained.

### Permission tiers

| Permission tier | `net_proxy_enable` / `net_proxy_disable` behavior |
|---|---|
| Full Access (`danger-full-access`) | No user prompt; takes effect immediately |
| Lower tiers (`read-only` / `workspace-write`, etc.) | Requires human approval before taking effect |

The read-only tools `net_proxy_status` / `net_proxy_probe` never require approval at any tier.

Available tools:

| Tool | Approval | Use |
|---|---|---|
| `net_proxy_status` | Read-only | Inspect revision, endpoint configuration, effective Agent route, provider overrides, fetch ownership, and persistent-shell generation. `verify` optionally probes connectivity. |
| `net_proxy_probe` | Read-only | Test the current or supplied endpoint without changing configuration. |
| `net_proxy_enable` | Required (except Full Access) | Point the Agent route at `default`; may update endpoint fields and persist the change. |
| `net_proxy_disable` | Required (except Full Access) | Restore the Agent route to direct; provider overrides and endpoint configuration remain. |

## Develop and test

```bash
pnpm install
pnpm test
pnpm run probe
```

Tests cover HTTP/CONNECT/SOCKS5 transport, timeouts, backpressure, `NO_PROXY`, redirects, probing, approval gates, settings-schema validation and YAML hot reload, compensating settings transactions, fetch/LLM/shell isolation, HMR/dispose idempotency, and real subprocess inheritance.

## References

- Transport reference: [mafeis/dsh-net-proxy](https://github.com/mafeis/dsh-net-proxy) (MIT).
- Configuration naming reference: [@cordisjs/plugin-proxy-agent](https://www.npmjs.com/package/@cordisjs/plugin-proxy-agent).

## License

MIT
