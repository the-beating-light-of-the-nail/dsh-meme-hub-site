# dshp

**Hand your whole dsh setup to someone as one file — and they get the exact same tree.**

English | [中文](README.zh.md)

```sh
npx github:asdf17128/dshp ls
```

Shows every profile on your machine in one line each. Read-only, zero dependencies.

<img src="https://raw.githubusercontent.com/asdf17128/dshp/0c78215b493a398e4a1d14c48dae0bc14a60db7f/assets/demo.svg" alt="dshp in use" width="760">

---

## What it gives you

**See what you actually have.** `dshp ls` and `dshp show` answer "what is
installed, in what order, and did I patch it" without opening a single file.

**Copy before you break it.** `dshp clone web web-test` duplicates a working
setup in under a second, `node_modules` and all. Experiment on the copy; `rm`
it when done.

**Share a setup that reproduces exactly.** `dshp export` writes bundle order,
plugin versions and your patch into one short file. `dshp import` rebuilds it —
verified: a 132-entry profile reproduced into a fresh `$DSH_HOME` composes an
identical tree, patch included.

dsh itself can boot a profile and forward installs to pnpm, but it cannot create
an empty one, list what you have, or copy a working setup before you experiment
on it. That is all manual work under `~/.dsh/profiles` today.

## Share a setup


```sh
dshp export web -o my-setup.dshp
```

```yaml
# dsh profile — reproduce with: dshp import <this-file>
dshp: 1
name: web
bundles:
  - @deepseek-ai/dsh-base
  - @deepseek-ai/dsh-web-app
  - dsh-cloudflare-browser-run
plugins:
  dsh-cloudflare-browser-run: "^0.1.1"
patch: |
  - id: session-title
    config:
      fallbackMaxWords: 12
```

Short enough to paste into a forum post. On the other machine:

```sh
dshp import my-setup.dshp
```

That writes the profile, installs the plugins through dsh's own pnpm, and you boot it with `dsh --profile web`. Verified end-to-end: a fresh `$DSH_HOME` reproduced a 132-entry tree identical to the original, patch included.

## Experiment safely

```sh
dshp clone web web-试验田      # instant, keeps node_modules
dsh plugin --profile web-试验田 add some-experimental-plugin
dshp diff web web-试验田
```

```
web -> web-试验田

plugins
  + some-experimental-plugin@^0.2.0
```

If it goes wrong, `dshp rm web-试验田 --yes`. Your working profile was never touched.

## Commands

| | |
|---|---|
| `dshp ls` | profiles, with bundle/plugin counts and disk size |
| `dshp show <name>` | bundles in load order, plugins, patch |
| `dshp new <name> [--web\|--headless]` | create a profile — dsh itself cannot make an empty one |
| `dshp clone <from> <to>` | copy a working setup, `node_modules` and all |
| `dshp export <name> [-o FILE]` | portable file (stdout by default) |
| `dshp import <file> [--as NAME] [--no-install]` | recreate a profile |
| `dshp diff <a> <b>` | what differs |
| `dshp rm <name> --yes` | delete |

## What a profile actually is

Under `$DSH_HOME/profiles/<name>`:

- `package.json` — `dependencies` are the plugins, `dsh.profile.bundles` is the ordered layer stack
- `cordis.patch.yml` — your own id-targeted overrides
- `cordis.yml`, `pnpm-workspace.yaml` — boilerplate, regenerated

So three things reproduce a setup: plugin versions, bundle order, and the patch. That is exactly what the portable file carries.

Bundle **order** is part of the format: it decides which layer patches which, so a reordering is reported by `diff` as a real difference.

The patch block is copied byte-for-byte rather than re-serialised, because it may hold `!!js` expressions (`root: !!js dshHomePath('sessions')`) that a YAML round-trip would mangle or evaluate. Nothing here ever evaluates your config.

## Install and uninstall

As a CLI: `npx dshp ls` — nothing to install.

As a plugin:

```sh
dsh plugin --profile web add github:asdf17128/dshp   # install
dsh plugin --profile web remove dshp                 # uninstall
```

Removing it drops the `list_profiles` and `export_profile` tools. Your profiles
are untouched — the plugin only reads.

## Compatibility

Verified against `@deepseek-ai/dsh` **0.1.0-rc.5**. The profile layout it reads
(`package.json` with `dsh.profile.bundles`, `cordis.patch.yml`) is dsh's own; a
change there is what would break it first.

## Requirements

Node 18+. `import` needs a working `dsh` (local `node_modules/.bin/dsh` preferred, otherwise on `PATH`) because it installs through dsh's own pnpm; every other command is pure filesystem work.

## See also

[dsh-doctor](https://github.com/asdf17128/dsh-doctor) — checks a profile for patches that silently stopped applying.

## License

MIT
