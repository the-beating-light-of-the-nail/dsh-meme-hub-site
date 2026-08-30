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
- Adds a compact `Settings → General → Network Proxy` row when the Web client is available; it edits the official namespace, tests a supplied endpoint, and shows discovered candidates without enabling them.
- In Full Access sessions, `net_proxy_discover` can proactively test proxy environment variables and a bounded set of loopback ports; restricted sessions fail closed and ask the user for `protocol`/`host`/`port`.
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

Version `0.4.2` is published to npm and is also available as a prebuilt tarball in the [GitHub Release](https://github.com/chenjiyan2001/dsh-proxy-routing/releases/tag/v0.4.2). Choose the installation path that matches how you run the plugin.

### Install through DSH (recommended)

Install the plugin into the `web` profile:

```bash
dsh plugin --profile web add dsh-proxy-routing@0.4.2
```

Replace `web` with another profile name when needed. This command updates the profile's package manifest and bundle list so DSH can load the plugin. Restart a running DSH process once after installation so it composes the new entry and registers the `net_proxy_*` tools. The DSH plugin command requires `pnpm` to be available on `PATH`.

### Install with npm

Install the published package into an npm-managed project:

```bash
npm install dsh-proxy-routing@0.4.2
```

This makes the package available as a Node dependency. Installing it with npm alone does not add the plugin to a DSH profile or its bundle list; for a normal DSH installation, use the DSH command above. The npm path is for a host application or custom profile that manages the package itself.

### Install from a local checkout (development only)

Add the plugin directory to the profile's `cordis.patch.yml` using an absolute path:

```yaml
- insert:
    - id: proxy-routing
      name: '/path/to/dsh-proxy-routing'
```

### First-use setup

Installation intentionally does not enable a proxy. The plugin only connects to an HTTP or SOCKS5 proxy that is already running; it never starts one or silently guesses an endpoint.

- In a Full Access Agent session, call `net_proxy_discover`. It checks proxy environment variables and a bounded set of common loopback ports. Successful candidates are reported only; confirm the candidate's purpose before enabling it.
- In a restricted Agent session, discovery is refused by design. Ask the user for an existing proxy's `protocol`, `host`, and `port`, then call `net_proxy_probe`.
- In Web, use `Settings → General → Network Proxy`. `Discover local proxy` and `Test connection` are read-only diagnostics; selecting or saving a candidate does not enable routing.
- After a successful probe, request `net_proxy_enable` with the endpoint. Full Access applies it without a prompt; lower permission tiers require human approval.
- Use `net_proxy_status` to verify the effective route and `net_proxy_disable` to return the Agent to direct mode.

For a manual setup, add the endpoint and a profile route to the `proxy-routing` YAML shown below. The Web diagnostics use the official loopback Connection RPC and never expose proxy credentials.

### Restart and hot reload

There are four separate mechanisms:

- **Install or remove a plugin:** `dsh plugin ... add/remove` edits the profile files. The already-running process does not rescan those files or rebuild its Cordis loader tree, so a restart is required for the first registration or removal.
- **Plugin host code:** official Cordis module HMR supports unloading and re-applying plugin code when the HMR service is enabled, its `root` includes the source, `timer` and loader internals are available, and the development host is started with the required Node internals. The normal Web profile currently overrides the shared HMR row with `disabled: true` because that Web reload lifecycle is still marked untested; this is a Web composition decision, not a general plugin limitation.
- **Plugin client code:** the Web profile keeps `@deepseek-ai/dsh-client-hmr` mounted. With `pnpm run dev:web` running from the same DSH checkout, changes to this package's `lib/client.js` can be delivered to the browser module graph without a page refresh. A normal installed package without the watcher still requires rebuilding the client artifact and refreshing.
- **Settings YAML:** the official settings-file provider watches `$DSH_HOME/settings.yaml`. Once the plugin is loaded, changes to the `proxy-routing` section are applied at runtime without restarting DSH.

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

> Proxy endpoint is not configured: in Full Access call `net_proxy_discover`; in a restricted session ask the user for `protocol`/`host`/`port`, call `net_proxy_probe`, then request `net_proxy_enable`.

## Agent Installation Guide

The Agent only discovers and requests use of an existing proxy; it does not start a proxy service. Recommended flow:

1. In Full Access, call `net_proxy_discover`; it checks proxy environment variables and a bounded set of loopback candidates. In a restricted session, do not scan; ask the user for `protocol`, `host`, and `port`.
2. When an external request, fetch, or download fails, call `net_proxy_status` and check whether `default` is configured.
3. Call `net_proxy_probe` to test the current or temporary endpoint. Do not invent an address when no endpoint is configured.
4. Request `net_proxy_enable` with the endpoint details. Under Full Access it takes effect immediately; under lower tiers, wait for human approval before retrying.
5. Request `net_proxy_disable` when direct routing should be restored. Explicit provider overrides are retained.

### Permission tiers

| Permission tier | `net_proxy_enable` / `net_proxy_disable` behavior |
|---|---|
| Full Access (`danger-full-access`) | No user prompt; takes effect immediately |
| Lower tiers (`read-only` / `workspace-write`, etc.) | Requires human approval before taking effect |

The read-only tools `net_proxy_status` / `net_proxy_probe` / `net_proxy_discover` never require approval at any tier.

Available tools:

| Tool | Approval | Use |
|---|---|---|
| `net_proxy_status` | Read-only | Inspect revision, endpoint configuration, effective Agent route, provider overrides, fetch ownership, and persistent-shell generation. `verify` optionally probes connectivity. |
| `net_proxy_probe` | Read-only | Test the current or supplied endpoint without changing configuration. |
| `net_proxy_discover` | Full Access only | Probe environment proxy variables and a bounded set of loopback candidates; reports successful candidates only and never enables or persists a route. |
| `net_proxy_enable` | Required (except Full Access) | Point the Agent route at `default`; may update endpoint fields and persist the change. |
| `net_proxy_disable` | Required (except Full Access) | Restore the Agent route to direct; provider overrides and endpoint configuration remain. |

## Develop and test

```bash
pnpm install
pnpm test
pnpm run build:client
pnpm run probe
```

`pnpm run build:client` emits `lib/client.js`, the Web module-loader artifact. For client HMR, run `pnpm run dev:web` from the same DSH checkout while developing; otherwise rebuild the client artifact and refresh the injected DSH Web page.

Tests cover HTTP/CONNECT/SOCKS5 transport, timeouts, backpressure, `NO_PROXY`, redirects, probing and bounded discovery, approval gates, settings-schema validation and YAML hot reload, loopback RPC validation, compensating settings transactions, fetch/LLM/shell isolation, HMR/dispose idempotency, and real subprocess inheritance.

## References

- Transport reference: [mafeis/dsh-net-proxy](https://github.com/mafeis/dsh-net-proxy) (MIT).
- Configuration naming reference: [@cordisjs/plugin-proxy-agent](https://www.npmjs.com/package/@cordisjs/plugin-proxy-agent).

## License

MIT
