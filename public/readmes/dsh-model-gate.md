# dsh-model-gate

English | [中文](README.zh.md)

Single-model disable gate for DSH. Deny whole provider routes or exact
`provider/model` pairs - denied models disappear from every discovery path and
any dispatch that still reaches them terminates with an in-protocol
`MODEL_DISABLED` error chunk.

Non-destructive by design: nothing in your provider configuration or
credentials is touched. The denylist is an independent overlay; removing an
entry (or the plugin) restores everything exactly as it was.

## Screenshots

**Settings panel** — the「模型门禁」section reads the UNFILTERED catalog through
the plugin's own typert service: one collapsible group per provider, one switch
per model row, enabled-count badge on the group header.

![Model gate settings panel](https://raw.githubusercontent.com/OPaimon/dsh-model-gate/99ff88fc9fe432faf8ba3dfc0b3f3d2e13809896/assets/settings-panel.png)

**Discovery hiding** — deny a model and it disappears from the web selector and
every other discovery path; the current selection clears with it.

| enabled | denied |
| --- | --- |
| ![Picker with the model enabled](https://raw.githubusercontent.com/OPaimon/dsh-model-gate/99ff88fc9fe432faf8ba3dfc0b3f3d2e13809896/assets/picker-model-enabled.png) | ![Picker with the model denied](https://raw.githubusercontent.com/OPaimon/dsh-model-gate/99ff88fc9fe432faf8ba3dfc0b3f3d2e13809896/assets/picker-model-denied.png) |

**Dispatch backstop** — a turn that still reaches a denied model (subagents,
session titles, stale references) ends with the in-protocol `MODEL_DISABLED`
error chunk; no network request is issued.

![Dispatch blocked with MODEL_DISABLED](https://raw.githubusercontent.com/OPaimon/dsh-model-gate/99ff88fc9fe432faf8ba3dfc0b3f3d2e13809896/assets/dispatch-blocked.png)

## Install

From npm - one command:

```sh
dsh plugin --profile web add dsh-model-gate
```

Or from a [Release](https://github.com/OPaimon/dsh-model-gate/releases) tarball -
download `dsh-model-gate-<version>.tgz`, unpack it, and point the official
installer at the unpacked directory (the tgz ships prebuilt lib/, so no build
step and no pnpm `allowBuilds` prompt):

```sh
tar -xzf dsh-model-gate-0.1.2.tgz    # -> ./package/
dsh plugin --profile web add ./package
```

Then restart DSH once so the bundle layer picks up the new entry. Every
denylist edit afterwards hot-applies through settings - no further restarts.
Verified against DSH 0.1.x-rc.

## Usage

Edit the denylist section in `~/.dsh/settings.yaml` - changes hot-apply, no
restart:

```yaml
llm-model-gate:
  disabledProviders:
    - openrouter
  disabledModels:
    - "*/kimi-k2.7-code"        # deny this model id on every provider
    - "token-rhythm/glm-5"      # deny one exact provider/model pair
```

Matching is exact and case-sensitive. A disabled provider route hides all of
its models. Model ids listed with a `*` + slash prefix are denied on every
provider, including dedicated routes (e.g. DeepSeek direct) that accept
explicit directory-external ids.

## Settings UI

The web settings page has a dedicated「模型门禁」section (one collapsible group
per provider, one switch per model row). The panel reads the UNFILTERED
catalog through the plugin's own typert service, so currently denied models
render as off and can be turned back on; toggling writes the denylist through
the same hot-apply settings chain as manual YAML editing.

Row-state notes:

- A row is off when its exact pair, a `*/model` star rule, or the whole
  provider route denies it; the reason is tagged on the row.
- Turning a star-denied row back on removes the covering star rule for every
  provider (the denylist has no per-provider exceptions); the panel re-renders
  from the returned state, so affected rows visibly flip together.
- Provider headers show an enabled-count badge; row switches are authoritative.

## Semantics

- **Discovery (primary)**: the web selector, `session.models` / `llm.models`
  catalogs, `task_models`, and API request validation all read the filtered
  view - a disabled model behaves as if it had never been configured.
  Re-enable and it reappears on the next refresh.
- **Dispatch (backstop)**: any path that still dispatches a denied model -
  subagents, session-title, custom routing, explicit ids - is stopped at the
  public `llm/stream` waterfall with a single terminal
  `finish{kind:"error", code:"MODEL_DISABLED"}` chunk. The turn ends with a
  normal model error; no network request is issued.
- If the disabled model is the current session or default model, the next
  request on it fails; nothing switches automatically. Failover-style plugins
  listening on `agent/request-error` compose naturally.

## Boundaries

- Vision-router clones are separate route keys: disabling `openrouter` does
  not disable `openrouter-vision` - list both if you want both.
- Providers stay installed; only their public listing is filtered. Provider
  configuration surfaces (adding/editing providers) are unaffected.
- Bypassing the DSH LLM service entirely (direct HTTP) is outside DSH.
- Uninstalling removes the bundle entry; the plugin restores the native
  `listProviders`/`listModels` methods on unload with zero residue. A
  leftover denylist section in `settings.yaml` is harmless.

## License

[MIT](LICENSE). An independently distributed plugin: DSH itself is untouched
and keeps its own license.

## Development

```sh
bash scripts/build.sh     # requires DSH_CHECKOUT or ~/dsh-harness; also shims node_modules/.bin/tsdown
npm run build:client      # bundle src/client/main.tsx -> lib/client.js (ModuleLoader wrapper)
npm test                  # unit tests (node:test) against lib/ - run the build first on a fresh clone
```

Tests import the compiled `lib/` outputs (relative ESM imports in source need
tsc's `.js` rewriting, which node's type stripping does not perform), which
resolves the host packages through the symlinks that `scripts/build.sh`
creates - run the build first on a fresh clone.

Inside a super-injector environment: `dev_inject_plugin <this dir>` then
`dev_reload_package` to iterate without restarting.
