# dsh-plugin-diraud

English | [中文](README.zh.md)


A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH)
plugin-management enhancement: group the plugin list by source so you can tell
**official** plugins apart from the ones **you installed yourself** at a glance.

## Features

- **`/plugin-audit` command**: lists the currently loaded plugins grouped by
  official / self-installed, with `user` / `official` / keyword filtering;
- **Self-installed plugin toggles (two surfaces)**:
  - Sidebar footer **Plugin Catalog** entry (icon button; click to open a
    panel): an enable/disable **button** on every self-installed card;
  - Composer: `/plugin-audit disable|enable <keyword>`;
  - Both persist to the profile's `cordis.patch.yml` (kept across restarts,
    reversible) and call `ctx.loader.update` for live effect (HMR-independent);
    official/builtin plugins are locked;
- **Plugin Catalog panel** (sidebar footer entry, since v0.5):
  - Cards grouped by source with a source badge, installed version, entry id
    and description; a search box filters by module name / entry id and every
    section shows a live count; a retry button appears if the list fails to
    load;
  - **Bilingual descriptions** (v0.6): a built-in module-name → {zh, en}
    dictionary is consulted first so card descriptions follow the UI language,
    falling back to each package's own `description`;
  - **GitHub link** (v0.8): when a package's `repository` / `homepage` points
    to GitHub, the card shows a GitHub button that opens its full feature
    documentation (independent of the built-in "Plugin list" page);
- **Self-installed plugin updates (v0.6)**:
  - The npm registry is checked automatically when the panel opens; the top
    "Update" bar shows how many plugins are outdated, with **Re-check** and
    **Update all** buttons, and every registry-installed card has its own
    **Update** button plus a progress bar while running
    (`pnpm add <pkg>@latest --config.minimumReleaseAge=0`, corepack/npx
    fallback, live output);
  - Updates are queued in a module-level store: clicks during a run merge into
    the next batch, two pnpm processes are never started concurrently, and the
    task keeps running (and stays observable) even if you close the panel;
  - **Source-aware labeling**: desktop-managed `link:` deps show
    "Updating with the desktop app" and local `file:` / `workspace:` deps show
    "Local plugin", so a pnpm exit code 0 is never misreported as an actual
    update; official/builtin plugins and this plugin itself (installed via
    `link:` to protect the dev chain) are locked;
- **Self-installed plugin uninstall (v0.6)**: every self-installed card has a
  red **Uninstall** button (right-most); it asks for confirmation, runs
  `pnpm remove`, disables the button while running, and refreshes the list
  afterwards. Non-self-installed packages and this plugin itself are rejected;

## Screenshot

Sidebar footer **Plugin Catalog** entry (since v0.5) — click to open the panel: self-installed plugins grouped by origin, each card with an enable/disable toggle:

The top bar shows the update area (`可更新: 1` = 1 update available, `重新检查`
= re-check, `全部更新` = update all), followed by the search box and the
grouped cards. Every card carries the enable/disable toggle, version, GitHub
button, update status and uninstall button:

![Plugin Catalog](https://raw.githubusercontent.com/tttwh/dsh-plugin-Audit/93a2fdd2a1ee227813e99867e79fd12e4603bfa1/docs/plugin-catalog-updates.png)

## Quick start

Prerequisites: `pnpm`, the `dsh` CLI.

```sh
# Install (recommended: from npm)
dsh plugin --profile web add dsh-plugin-diraud

# Or from the GitHub main branch
dsh plugin --profile web add https://github.com/tttwh/dsh-plugin-diraud/archive/refs/heads/main.tar.gz
```

**Restart `dsh web`**, then:

- Type `/plugin-audit` in the composer, or
- Click the **Plugin Catalog** entry at the sidebar footer.

## Commands

| Command | Purpose |
|---|---|
| `/plugin-audit` | Overview: self-installed one-by-one + official count |
| `/plugin-audit user` | Self-installed only |
| `/plugin-audit official` | Official only (full list) |
| `/plugin-audit <keyword>` | Filter by package / entry keyword |
| `/plugin-audit disable <keyword>` | Disable a matching **self-installed** plugin (persisted) |
| `/plugin-audit enable <keyword>` | Enable a matching **self-installed** plugin (persisted) |
| `dsh plugin --profile web remove dsh-plugin-diraud` | Uninstall |

> **How toggles persist**: `disable/enable` writes a `- id: <raw config id>` +
> `disabled: true` override into the profile's `cordis.patch.yml` (the user
> config layer). dsh watches that file (`watchUserPatches`), so the change
> applies live without a restart, survives restarts, and deleting the row
> restores the default.
>
> **Why the raw id (fixed in v0.4)**: loader entries carry a path-prefixed full
> id (`include:ssh`), but the patch layer matches each config row's own `id`
> field (`ssh`). Older versions wrote the prefixed id into the patch file, so
> the row was skipped at boot ("patch: entry not found") and the toggle was
> silently lost on restart. v0.4 writes the raw id, keeps the full id for
> `ctx.loader.update`, and cleans up legacy `include:<id>` rows.

## Configuration

Origin is derived from the package scope by default; edge cases (e.g. a
third-party package published under `@deepseek-ai/`) are overridden via
`extraUserPackages`. Override this plugin's row in the profile's
`cordis.patch.yml`:

```yaml
- id: plugin-audit
  config:
    extraUserPackages:
      - '@deepseek-ai/dsh-my-fork'   # force-classify as self-installed
```

## Repository layout

```text
dsh-plugin-diraud/
  src/classify.ts        origin-classification pure function (single source of truth)
  src/patch.ts           cordis.patch.yml read/write (persist toggles)
  src/toggle.ts          shared toggle core (persist + ctx.loader.update)
  src/updates.ts         update core: semver compare, registry probe, pnpm exec (unit-testable)
  src/metadata.ts        GitHub repository/homepage → canonical URL (v0.8)
  src/translations.ts    bilingual description dictionary (v0.6)
  src/render.ts          /plugin-audit output rendering (grouped view)
  src/contract.ts        typert wire contract (pluginAudit/toggle)
  src/typert.ts          host manifest registration
  src/runtime.ts         PluginAuditRuntime (@Remote toggle; executeToggle unit-tested)
  src/index.ts           host: /plugin-audit command + remote registration
  src/client/            Sidebar Plugin Catalog entry (React) + toggle buttons + client remote
  src/client/updateStore.ts  module-level update task store (queue + resume)
  build.mjs              esbuild build (host ESM + client bundle)
  cordis.patch.yml       profile bundle patch (inserts this plugin)
  demo/                  demo & verification scripts (real-profile output)
```

## Docs

- [DESIGN.md](DESIGN.md) — design rationale and source evidence (why a new tab
  instead of modifying the official one; classification rules and edge cases)

## Related

- [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — DeepSeek Harness official repo (DSH itself)
- [omdsh-dev/community](https://github.com/omdsh-dev/community) — community plugin submissions & collaboration hub

## License

[MIT](LICENSE) · Copyright (c) 2025 tttwh
