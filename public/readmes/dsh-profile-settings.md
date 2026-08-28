# @xmoon76/dsh-profile-settings

English | [中文](README.zh.md)

A DSH **profile bundle** that adds a per-profile settings overlay on top of the
official user-settings seam. `$DSH_HOME/settings.yaml` stays the global
baseline; every profile can override any settings namespace through its own
`$DSH_HOME/profiles/<name>/settings.patch.yml` — object sections merge
recursively, arrays and scalars replace wholesale, and `!unset` explicitly
deletes an inherited value.

```text
Schema Defaults
      ↓
Composition Base
      ↓
~/.dsh/settings.yaml              (global user layer)
      ↓
~/.dsh/profiles/<name>/settings.patch.yml   (profile user layer)
      ↓
Effective Settings
```

Existing plugins keep using `ctx.settings` exactly as before — the overlay is
transparent. Writes (`update` / `replace` / `mutate`) land in the **profile
overlay only**; `replace({})` re-inherits the global layer, never the
composition default. The official schema validation, revision semantics,
`expectedRevision` conflict detection, watchers, and events are untouched.

## Installation

Requires a profile whose bundles include `@deepseek-ai/dsh-base` (every
shipped `web` / `headless` template does). Install into each profile that
should get its own overlay:

```sh
dsh plugin --profile web add @xmoon76/dsh-profile-settings
dsh plugin --profile pi-tui add @xmoon76/dsh-profile-settings
```

`dsh plugin --profile <name> add` installs the package and reconciles it into
the profile's `dsh.profile.bundles` automatically (the manifest declares
`dsh.bundle`). On the next boot the bundle patch (`cordis.patch.yml`)

1. disables the base `settings` row (`@deepseek-ai/dsh-settings-file`), and
2. inserts the `profile-settings` row owning `ctx.settings`.

One composition may only hold one `ctx.settings` owner: if the base row is
still active beside this one, boot fails loud (Cordis duplicate-service
error) — never a silent override.

## Configuration

The inserted row needs no config (defaults below); a profile's own
`cordis.patch.yml` may override the row's `config`:

| key          | default                                              | meaning                                |
| ------------ | ---------------------------------------------------- | -------------------------------------- |
| `profile`    | auto-detected                                         | explicit active profile name           |
| `globalPath` | `$DSH_HOME/settings.yaml`                             | global settings document               |
| `profileFile`| `settings.patch.yml`                                  | overlay filename inside the profile dir |
| `dshHome`    | `$DSH_HOME` or `~/.dsh`                               | harness home                            |
| `watch`      | `true`                                                | hot-reload both documents               |
| `debounceMs` | `100`                                                 | watcher write-settle window             |
| `writable`   | `true`                                                | allow in-process writes into the overlay |

The active profile is resolved in this order (never from cwd): explicit
`profile` config → install location
(`profiles/<name>/node_modules/…`, the `dsh plugin` layout) → launcher
`--profile <name>` / `--profile=<name>` → `DSH_PROFILE` environment variable.
If none can be determined, boot fails loud.

## The overlay file

```yaml
# $DSH_HOME/profiles/web/settings.patch.yml
agent-default-model:
  provider: pi-ai
  model: gpt-5.6

permission:
  mode: danger-full-access

some-plugin:
  endpoint: !unset
```

Plain YAML values are overrides; `!unset` masks the lower layers (the
inherited value is deleted and the schema default applies unless the overlay
supplies its own value). Masks never enter the resolved JSON document — the
UI never sees them as values. The file is edited by hand or through the
`settings` command; in-process writes land here, never in `settings.yaml`.

## The `settings` command

When a command runtime is mounted, `ctx.profileSettings` and the `settings`
command family are available:

```text
settings layers [ns [path]]        per-leaf source provenance
settings get <ns.path>              effective value
settings set <ns.path> <value>      write the profile overlay
settings unset <ns.path>            delete an overlay value (re-inherit)
settings mask <ns.path>             write !unset
settings unmask <ns.path>           remove the mask
settings reset <ns>                 replace({}) on the overlay
settings promote <ns.path>          move a value up to the global document
settings demote <ns.path>           move a value down to the profile overlay
settings migrate <ns.path> [--copy] move a global value into the overlay with
                                    .bak.<timestamp> backups (--copy keeps it)
settings diff [ns]                  leaf-level global vs overlay diff
settings ui [ns]                    machine-readable layer snapshot (Web UI)
settings profile                    active profile and document paths
```

## Web UI (Profile Settings page)

The bundle ships a browser half (`dsh.client`): the web Settings panel gains
a **Profile Settings** section with per-field source badges (Default /
Composition / Global / Profile / Masked), the effective value, and
set / unset / mask / unmask / promote / reset actions. All host interaction
flows through the `/profile-settings` loopback RPC channel registered by the
host half — no session context, no command logs.

## Configuration chain and design notes

The provider keeps the official base-class document as the **profile raw
section**, so `update`/`replace`/`mutate`/`revision`/`expectedRevision`/
`describe` keep their exact semantics; the global layer is folded into each
registration's composed `base` (`applyMasks(merge(composition, global), masks)`).
Only a narrow typed facade over the base class's TS-private members is
touched — no Settings machinery is forked. See `docs/research.md` for the
full M0 findings.

Fail-loud (boot): unresolvable profile, overlay root not a map, non-object
namespace section, `!unset` inside an array, unsupported YAML tags
(`!!js/*`, `!!python/*`, custom tags), overlay path escaping the profile
directory, global and overlay pointing at the same file, duplicate
`ctx.settings` owner.

Warn + keep last good (hot reload): temporarily invalid YAML in either
document, unregistered namespaces (they are preserved for later-loading
plugins).

## Concurrency model and limitations

| Scope | Guarantee |
| --- | --- |
| In-process ordinary `update`/`replace`/`mutate` | official Settings semantics (per-namespace serialized write queue, `expectedRevision` conflict detection) |
| Cross-process file integrity (read-modify-write) | writer locks on both documents + atomic rename |
| Cross-process custom layer operations (`promote`/`demote`/`migrate`/`mask`/`unmask`) | true transactions: both locks in a fixed order, fences checked inside the locks, layer revisions advance on every text change |
| Cross-process ordinary `update`/`mutate` on the SAME profile + namespace | inherits the official seam limitation: the official revision is process-local to its write queue, so cross-process CAS on one namespace is best-effort (the last writer wins under the file lock) |

## Development

```sh
npm run typecheck   # tsc over src + tests
npm test            # vitest
npm run build       # tsc build + copy-lib (lib/)
npm pack            # prepack build + postpack tarball smoke (leak checks)
```

Requires Node ≥ 22.6 (type stripping) and a DSH harness (0.1.1-rc.2 family)
for the peer dependencies, which resolve from the running installation — the
package never bundles its own harness copy, so no module twin.

## License

MIT
