<div align="center">

# 洞察 · dsh-insight

**One screen that answers what a DeepSeek Harness profile is actually made of.**

Every plugin, service, tool and model — where it came from, which config layer inserted or disabled it, and whether it is running right now. Read-only.

[![npm](https://img.shields.io/npm/v/@gwsbhqt/dsh-insight?logo=npm&label=npm)](https://www.npmjs.com/package/@gwsbhqt/dsh-insight)
[![downloads](https://img.shields.io/npm/dt/@gwsbhqt/dsh-insight?logo=npm&label=downloads)](https://www.npmjs.com/package/@gwsbhqt/dsh-insight)
[![CI](https://github.com/gwsbhqt/dsh-insight/actions/workflows/ci.yml/badge.svg)](https://github.com/gwsbhqt/dsh-insight/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-111111.svg)](LICENSE)
[![stars](https://img.shields.io/github/stars/gwsbhqt/dsh-insight?style=flat&logo=github&label=Star)](https://github.com/gwsbhqt/dsh-insight/stargazers)

[Install](#install) · [The five axes](#the-five-axes) · [Why it refuses to guess](#why-it-refuses-to-guess) · [Read-only by design](#read-only-by-design) · [简体中文](README.zh-CN.md)

</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/hero.png" width="900" alt="洞察 — five axes over one DeepSeek Harness profile">
</p>

## Install

```sh
dsh plugin --profile web add @gwsbhqt/dsh-insight
```

Update:

```sh
dsh plugin --profile web update @gwsbhqt/dsh-insight@latest
```

Then open **Settings → 洞察 / Insight**. No build step, no restart. The panel ships both halves: a host plugin that collects the data and a browser plugin that draws it.

## The problem

A running `dsh` profile is assembled from layers you never see side by side:

- each bundle's own `cordis.patch.yml` (`@deepseek-ai/dsh-base`, market packages, your own plugins)
- your profile's patch layer, `$DSH_HOME/profiles/<name>/cordis.patch.yml`
- `$DSH_HOME/settings.yaml` — model providers, the default model, permission presets
- `$DSH_HOME/.credentials.yaml` and environment variables

Which of it survives is decided by patch semantics (insert / update / disable, by id) and by what the cordis loader actually managed to start. **No single file tells you the answer**, so "why isn't this plugin running" and "where did this model come from" turn into a hunt across four files and a runtime you cannot see.

洞察 does that derivation for you, live, and shows its work.

## The five axes

One dataset, five ways to sort it. The order is causal: **config produces plugins, plugins provide services, services register tools and models.** Switching axes never clears your selection.

### 按配置 · By config — which layer wins

<img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/config.png" width="900" alt="By config: every patch layer in application order, with what it did">

Every config layer in application order, with what it did to the tree — `inserted 78`, `overrode 2`, `disabled 24`. The first and last layers are marked, because a number alone never says which direction wins. Config files that take no part in the merge (the profile's `cordis.yml`, `settings.yaml`, `.credentials.yaml`) are listed in the same table, marked as such — you usually want them for their paths.

Pick a layer and the right pane names every entry it touched, each one a link into the plugin axis.

### 按插件 · By plugin — the dossier

<img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/plugins.png" width="900" alt="By plugin: the runtime tree with per-plugin provenance, wiring and settings">

The live loader tree — containers, nested realms, disabled entries folded away at the end of the level they belong to. Select one and get its whole dossier:

- **Where it came from** — the layer that inserted it, its full entry id, its package and path on disk
- **Wiring** — services it provides and consumes, each with its counterpart; built-in host services are named as such instead of showing up as a missing provider
- **Blast radius** — who depends on it, transitively, so "what breaks if I turn this off" is a number and a list rather than a guess
- **Its settings** — effective value, plugin default, and your override, side by side
- **How the config stacked up** — the ordered list of layers that touched this entry, and what each one did

Filter chips narrow the same list: needs attention, you changed it, disabled, runtime-registered, not official.

### 按服务 · By service — what actually connects plugins

<img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/services.png" width="900" alt="By service: providers, consumers and blast radius">

Services are the real edges between plugins, so they get their own axis: who provides each one, how many consume it, and — for a hub — the full impact list. This is a table and not a canvas on purpose: the dependency graph of a real profile is star-shaped, and a hub's edges cross the whole canvas no matter which layout you pick.

### 按工具 · By tool — what the agent can actually call

<img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/tools.png" width="900" alt="By tool: tool names, the package that registered each one, and what goes with it">

One row per **tool name** — `bash`, `read`, `exit_plan_mode` — not per plugin. Each one carries the package that registered it, its description, and how many sibling tools would disappear with it, because turning a tool off means disabling the plugin that registers it.

Upstream records no registrant on a tool definition, and tools are not registered until an agent is constructed. So this axis is assembled two ways and says which one it used: **observed at runtime** (the panel listens in as registration happens and attributes it by call stack) or **inferred from source** (a scan of the plugin's build output, marked as such — it can miss a name computed at runtime). A [request is open upstream](docs/upstream/tool-provenance.md) for the field that would make the second path unnecessary.

### 按模型 · By model — every model and how it got here

<img src="https://raw.githubusercontent.com/gwsbhqt/dsh-insight/e58e324232e66da00949421fca9254a22c7563cf/docs/assets/models.png" width="900" alt="By model: models, providers, activation method and the plugin behind each route">

One row per model, with the provider route it belongs to and the plugin that brought that route in. The detail pane names the exact settings path its configuration lives at, and how the route is activated — **an API key from an environment variable, a stored API key, or an OAuth grant**. Provider routes that upstream declares as configurable but you have not set up are folded away at the end.

Nothing here touches the network: the panel reads the llm service's own read-only faces, never the model-discovery endpoint that would call your providers.

## Why it refuses to guess

Most of the work in this plugin is in the cases where the honest answer is "I don't know", and saying so instead of showing a plausible number:

- **Ambiguous short ids get no attribution.** The same short id can exist in two realms (`include:tool-bash` and `include:agent-presets:tool-bash`). When a short id is not unique on both sides, the layer that inserted it is left blank rather than guessed.
- **Unevaluated expressions are not treated as `false`.** `!!js` expressions in config survive replay as an opaque marker; they are excluded from the drift report instead of being coerced to a boolean. Coercing them produced 22 false "this plugin was disabled" reports before this was fixed.
- **Multiple candidate providers stay multiple.** When two plugins provide the same service name, the panel lists both instead of drawing a confident edge to one.
- **Inferred data is labeled.** A tool name extracted from build output is marked `inferred`; one observed at registration is not.
- **Settings with no plugin say so.** A settings namespace whose owner cannot be identified is labeled as a settings namespace, not shown as a plugin with a blank package.
- **Version skew degrades, it does not break.** When the host process is older than the browser bundle (a rebuild without a restart), the summary is recomputed in the browser and says so, and an axis whose endpoint the host does not know yet stays empty with an explanation instead of turning the panel red.

## Read-only by design

- The panel **never writes configuration**. There is no edit surface and no write path in the host half.
- **Credential bodies are never read.** `.credentials.yaml` is listed for its path and size and is excluded from the preview allowlist. Activation methods are read through the credential service's enumeration face, whose contract is "every stored record, values excluded" — the panel learns *that* a record is an API key or an OAuth grant, never what it contains.
- **File preview is allowlisted.** `files/read` and `files/open` accept only paths the host itself discovered, validated after resolution.
- The one action that leaves the browser is **open in editor**, on an allowlisted config file or plugin directory, at your click.
- The tool observer wraps `tools.register` **in memory only**. It writes no files, and touches neither `node_modules` nor the harness installation.

## Development

```sh
pnpm install
pnpm check          # typecheck + build + 83 tests

dsh plugin --profile <name> add /path/to/dsh-insight   # install the working copy
dsh --profile <name>
```

`pnpm watch` rebuilds on change; the harness picks up the new bundle on page reload.

## License

[MIT](LICENSE)
