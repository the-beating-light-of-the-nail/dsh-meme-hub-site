# dsh-plugin-toggle · Enable/Disable DSH Plugins from Settings

> Turn DSH plugins on and off **directly from Settings → Plugins**: an additive **"Enable/Disable"** tab beside the read-only "Plugin list". Flipping a toggle **stops/starts the plugin immediately** (no restart) and **persists** the change so it survives a DSH restart. 在 DSH 设置 → 插件页直接启用/停用插件：新增「启用/停用」标签页，切换开关即时停止/启动插件并持久化，重启后依旧生效。
>
> 中文文档: [README.zh.md](README.zh.md) · LLM index: [llms.txt](llms.txt) · Agent guide: [AGENTS.md](AGENTS.md)

![dsh-plugin](https://img.shields.io/badge/dsh--plugin-ready-4c8dff) ![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-✓-0f1115) ![license](https://img.shields.io/badge/license-MIT-green) ![install](https://img.shields.io/badge/dsh%20plugin%20add-✓-22c55e)

**Keywords**: `dsh-plugin` · `deepseek-harness-plugin` · plugins · settings · enable · disable · toggle · loader · 插件 · 启用 · 停用

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗️ How it works](#️-how-it-works)
- [🚀 Quick start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [❓ FAQ](#-faq)
- [⚠️ Security notes](#️-security-notes)
- [📦 Project structure](#-project-structure)
- [🙏 Credits](#-credits)

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🎚️ **Enable/Disable tab** | New tab in Settings → Plugins (id `toggle`, order 20) beside the shipped read-only "Plugin list" — the shipped page is never shadowed |
| 🔄 **Live toggle** | Flipping the switch calls the Cordis Loader's `Entry.update({disabled})` — the plugin fiber is disposed (stop) or started immediately, no DSH restart |
| 💾 **Persists across restarts** | Each change is appended to the profile's own `cordis.patch.yml` (the documented user patch layer), so the state survives a DSH restart |
| 📊 **Status at a glance** | Each row shows the plugin name, an Enabled/Disabled tag, and the Cordis phase (active / pending / failed / not mounted) |
| 🔒 **Safety guard** | The loader's `include` entry and this plugin itself are locked; unknown ids return `404`, locked ids return `403` |
| 🛡️ **Read-only list** | `GET` returns the same Loader projection the shipped inventory uses (`entryId`, `moduleName`, `enabled`, `fiberPhase`) — no Remote seam needed |
| 🌗 **Theme-aware** | All colors use `--dsw-alias-*` design tokens; follows light/dark automatically |
| ♨️ **Survives restarts** | Real profile-bundled plugin: install once with `dsh plugin add`, auto-loads on every DSH boot — no per-session define, no cordis_define |

## 🏗️ How it works

```
Settings → Plugins → "Enable/Disable" tab (additive, id `toggle`)
                                  │
Client bundle (browser)           ▼
  └─ fetch GET /plugin-toggle/api → list of loader entries
  └─ one row per plugin: name + Enabled/Disabled tag + Cordis phase + toggle switch
  └─ toggle flipped → fetch POST /plugin-toggle/api { entryId, disabled }
                                  │
Host half (DSH process)           ▼
  └─ webServer route POST /plugin-toggle/api
  └─ loader.resolve(entryId).update({ disabled })
       └─ disposes the fiber (stop) or starts it (enable) — live, no restart
  └─ appends `- id: <rawId>` / `disabled: <bool>` to the profile's cordis.patch.yml
       (the user patch layer, applied after every bundle layer → wins at boot)
  └─ returns { ok, entryId, disabled, fiberPhase, persisted }
                                  │
Client bundle (browser)           ▼
  └─ toast: "Disabled <plugin>" / "Enabled <plugin>" (or the error) → list reloads
```

- **Live + persistent, decoupled**: `Entry.update()` (entry-level) does **not** write the loader tree back to `cordis.yml` — the live effect is in-memory only, and persistence is the append to `cordis.patch.yml`. No patch flattening, no duplicate rows.
- **Patch semantics**: `cordis.patch.yml` rows are id-targeted overrides; later rows win, so re-enabling appends `disabled: false` and simply overrides the earlier `true`.
- **Persistence**: ships `dsh.bundle` (`cordis.patch.yml`) + `dsh.client` (`exports["./client"]`, bundled) so it installs as a real profile plugin that the DSH client-modules scanner loads on every boot.

## 🚀 Quick start

### Standard install: `dsh plugin add` (persists across restarts)

Install the package from this GitHub repo:

```bash
# local directory (from the parent of this repo):
dsh plugin --profile web add ./dsh-plugin-toggle

# or directly from GitHub (any DSH machine):
dsh plugin --profile web add github:Zenjibad/dsh-plugin-toggle
# or:
dsh plugin --profile web add git+https://github.com/Zenjibad/dsh-plugin-toggle.git
```

`dsh plugin add` is a pnpm add into the profile plus a `dsh.profile.bundles` reconcile: seeing this package's `dsh.bundle` declaration, it appends `dsh-plugin-toggle` to the bundle stack. **Restart DSH, then hard-refresh the browser tab** (`Ctrl+F5`). On boot the client-modules scanner resolves `exports["./client"]` and the new tab appears in Settings → Plugins. No per-session define, survives restarts.

> ⚠️ **Important**: after installing (or updating) a client plugin, a **hard page refresh** (`Ctrl+F5`) is required — the DSH client HMR only hot-swaps already-loaded bundles and does not pull in *new* bundles into an open tab.

### Manual profile mount (alternative)

1. `git clone https://github.com/Zenjibad/dsh-plugin-toggle.git` (any location).
2. Add to `~/.dsh/profiles/web/package.json` `dependencies`: `"dsh-plugin-toggle": "link:<repo-path>"`, then `pnpm install` in the profile dir.
3. Restart DSH.

### Requirements

- A DSH web profile (`dsh --profile web`) whose loader is running — the tab reads and toggles its entries.
- Toggling a plugin that other plugins depend on will put those dependents into `pending`; re-enabling recovers them (standard Loader behavior).

## ⚙️ Configuration

No config file, no persisted settings of its own. Behaviour is fixed by constants in the source:

| Knob | Location | Default |
| --- | --- | --- |
| HTTP route | `src/index.ts` | `GET|POST /plugin-toggle/api` |
| Locked entries | `LOCKED` / `LOCKED_NAMES` in `src/index.ts` | `include`, `cordis:include`, `dsh-plugin-toggle` |
| Tab seat | `src/client/index.tsx` | `settings.plugins.tab` id `toggle`, order 20 |
| Toast duration | `src/client/index.tsx` | 6 s |
| Persistence target | derived from the loader's `include` entry | `<profile>/cordis.patch.yml` |

## ❓ FAQ

**Q: The "Enable/Disable" tab is missing?**
A: Restart DSH (if the host half isn't mounted yet), then **hard-refresh the browser tab** (`Ctrl+F5`). New client bundles only appear on a full page reload — the HMR client does not add new bundles to an already-open tab.

**Q: I disabled a plugin but it still runs?**
A: The toggle is live — `Entry.update({disabled})` disposes the fiber immediately. If a dependent plugin keeps providing the same service, that is its own behavior; check the row's phase (should show "Not mounted").

**Q: Does the change survive a restart?**
A: Yes. Each toggle appends a `- id: <entry>` / `disabled: <bool>` row to the profile's `cordis.patch.yml`, the documented user patch layer applied after every bundle layer. If the append failed, the toast says "not persisted across restart" and only the current session is affected.

**Q: Why can't I toggle some entries?**
A: The loader's `include` entry and this plugin itself are locked (`403`); unknown ids are `404`. Everything else — including `@deepseek-ai/dsh-*` host plugins — is toggleable; disabling a provider puts dependents into `pending` until you re-enable it.

**Q: Will disabling a plugin uninstall it?**
A: No — it only stops the Loader entry and adds a `disabled` override. The package stays installed; re-enabling starts it again.

**Q: How do I remove the toggle plugin itself?**
A: `dsh plugin --profile web rm dsh-plugin-toggle` (or delete the profile dependency + bundle entry) and restart DSH. Note: if you previously disabled other plugins, their `cordis.patch.yml` rows remain (they are the persistence layer, independent of this plugin).

## ⚠️ Security notes

- **No Remote seam, no writes to the loader config**: the client only calls the same-origin `/plugin-toggle/api` route; the host never writes `cordis.yml` or any bundle patch — only appends rows to the profile's own user patch layer.
- **Input validated**: `entryId` must resolve in the loader; locked ids (`include`, self) are rejected with `403`; unknown ids with `404`.
- **Small payloads**: POST bodies are capped at 1 MB.
- **Live-stop is intentional**: disabling a plugin disposes its fiber immediately — the same operation `cordis_stop` performs; re-enabling restarts it.

## 📦 Project structure

```
dsh-plugin-toggle/
├── src/
│   ├── index.ts            # host half: list projection, loader.resolve().update(), cordis.patch.yml append, route
│   └── client/index.tsx    # client bundle: Enable/Disable tab, toggle switches, toast
├── cordis.patch.yml        # dsh.bundle patch (inserts the plugin row on boot)
├── tsdown.config.ts        # bundles host (node ESM) + client (CJS ModuleLoader)
├── package.json            # name, exports["./client"], dsh.client + dsh.bundle
├── lib/                    # build output (index.js, client.js)
├── AGENTS.md               # repository guide for AI agents
├── llms.txt / llms-full.txt
├── README.md / README.zh.md
└── LICENSE
```

## 🙏 Credits

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — the DSH plugin/dynamic runtime, Cordis Loader, Slots, theme, webServer, client-modules.
- [headroom-stats-plugin](https://github.com/Zenjibad/headroom-stats-plugin) — reference for the packaged client-plugin build pattern (tsdown host/client split, `cordis.patch.yml`, `dsh.client`).
- [dsh-drop-any-file](https://github.com/Zenjibad/dsh-drop-any-file) — sibling plugin; same packaging pattern and doc suite.

## Repo

[![GitHub](https://img.shields.io/badge/GitHub-Zenjibad%2Fdsh-plugin-toggle-181717)](https://github.com/Zenjibad/dsh-plugin-toggle)

A packaged DSH profile plugin — requires DeepSeek Harness (Node >= 18) with a web profile and the Cordis Loader.

## 📄 License

[MIT](LICENSE)
