# dsh-full-with-approval

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) profile plugin that adds a fourth permission preset, **`full-with-approval`**:

- **Full compute access** — the session sandbox mode is `danger-full-access`, so processes run *unconfined*: CUDA/GPU, devices, network and any binary your machine can run.
- **Approval-gated file edits** — while this preset is active, every `write`/`edit` that would modify
  - a file **outside the session workspace** (except the platform temp areas and configured scratch roots), or
  - a **protected file** inside the workspace (default: `.git/**`, `.env*`),
  
  asks the user for one-shot approval *before* anything executes. Approval is resolved through the same interactive prompt the sandbox escalation retries use (`ctx.approval`, `allowed-once`). Rejected or cancelled ⇒ the tool fails and nothing is written. If no approval channel is available, the call fails closed.
- **Approval-gated shell modifications** — a `bash`/`pwsh` command that shows *evidence* of modifying files outside the workspace (out-of-workspace path tokens plus a write marker: redirection, `chmod`, `rm`, `python`, `curl -o`, …) also asks first; visibly read-only invocations (`cat`, `ls`, `grep`, `env`, … without a write marker) and workspace-relative commands pass without prompting. The static heuristic errs on the side of asking: interpreters (`python`, `node`) and command substitutions that mention outside paths always ask. `bashGuard: false` disables this layer; `extraBashTokens` adds forced-ask substrings.

Everything else — writes inside the workspace to ordinary files, temp/scratch files, all reads and every command — proceeds untouched.

## How it works

The plugin is a thin load-bearing layer over existing DSH extension points; **no core package is modified**.

1. `cordis.patch.yml` patch entry `full-with-approval` mounts the host plugin.
2. The same patch overrides the `permission` preset table (by id) to add the 4th preset `full-with-approval = { sandbox: danger-full-access, approval: ask }`. The GUI permission selector and `/permission` command read this table, so the new row appears automatically.
3. The plugin listens on the tools registry's `tools/pre-execute` waterfall (the official *allow / deny / ask before dispatch* hook). When the session's effective preset is `full-with-approval` and the call is a `write`/`edit` whose target is outside the workspace or protected, it returns `{ kind: "ask", reason }`. The registry resolves the ask through `ctx.approval.request(...)` and only dispatches on `allowed-once`.

## Install

```sh
# from the parent directory of a git checkout (pnpm `file:` install: copies the
# package and installs its declared dependencies)
dsh plugin --profile web add ./dsh-full-with-approval

# or from a local folder by absolute path (the `link:` form does not manage the
# plugin's own dependencies; keep `npm install` in the checkout)
dsh plugin --profile web add /path/to/dsh-full-with-approval

# once published as an npm package
dsh plugin --profile web add dsh-full-with-approval
```

`dsh plugin add` runs pnpm and reconciles the profile's bundle list: a package declaring `dsh.bundle` joins the layer stack automatically. The change applies on the next boot of the dsh profile (restart the app / refresh after HMR).

> If pnpm aborts with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` (a supply-chain policy on the profile's lockfile, unrelated to this plugin), relax it for the install:
> ```sh
> dsh plugin --profile web add ./dsh-full-with-approval --config.minimum-release-age=0
> ```

## Usage

- In the web UI open the permission selector and pick **Full With Approval** (4th option), or run:
  ```
  /permission full-with-approval
  ```
- While the preset is active, protected writes raise the approval prompt; approve to let that one write through.
- Switch back to `workspace-write` / `danger-full-access` / `read-only` at any time; the gate follows the preset.

## Configuration

The plugin entry config (patch `cordis.patch.yml` in the profile or override via `cordis.patch.yml` of your profile):

```yaml
- id: full-with-approval
  config:
    # Globs matched against the POSIX path relative to the session workspace.
    # An absolute pattern matches the absolute target path.
    protectedPaths:
      - ".git/**"
      - ".env*"
      - ".env/**"
    # Absolute scratch roots that never prompt (besides the platform temp dir).
    extraWritableRoots: []
    # Shell guard layer (default true): ask for bash/pwsh commands that show
    # evidence of modifying files outside the workspace.
    bashGuard: true
    # Extra substrings that force an ask when a shell command mentions them.
    extraBashTokens: []
```

Changing `protectedPaths` takes effect on reload/restart.

## What is intentionally NOT gated

- **Reads** are always allowed (every sandbox mode permits reading), including reads of outside files by obviously read-only commands (`cat`, `ls`, `grep`, `env`, … without a write marker).
- **Temp areas** (`/tmp`, `os.tmpdir()`) and `extraWritableRoots` never prompt.
- **Shell writes are gated by heuristic, not by kernel** — a command can still evade the static check (paths built dynamically, `cd` followed by relative writes, opaque interpreters hiding file access). The heuristic errs toward asking; treat it as a prompt-on-suspicion layer, not a security boundary. The kernel-level boundary remains `workspace-write` mode at the cost of GPU access.

## Known caveats

- **Selector icon** — the core Web UI draws permission icons from a value-keyed table inside the `@deepseek-ai/dsh-client-ui-conversation` client bundle; plugin-added presets get none (the flat client module graph cannot override that table from a plugin bundle). Until supported upstream, draw the 4th row's shield-check glyph with one command (idempotent, backs up the bundle file, live-served — refresh the page after re-running on each dsh upgrade):
  ```sh
  node tools/patch-ui-glyph.mjs
  ```
- The 4th option does not show the extra risk-confirmation gate the stock `danger-full-access` row shows (that gate is keyed on the preset value in the core UI client); the row's own one-shot approvals still guard every protected write.
- `run_code`/code-mode executions are not inspected for file effects; native `write`/`edit` calls and `bash`/`pwsh` commands are gated.
- Path classification is canonicalize-then-compare against the session workspace; on filesystems with odd symlink aliasing (Windows 8.3, case-insensitive paths) treat the workspace boundary as advisory — the sandbox fence itself is the kernel-level authority where modes confine.

## Development

```sh
npm ci                          # picomatch + harness deps
node --test                     # classifier unit tests
DSH_AI_NODE_MODULES=/path/to/node_modules/@deepseek-ai \
  node test/pre-execute.harness.mjs   # full ask→approval→dispatch chain
```

See also `examples/cordis.patch.yml` for the explicit knob values, and
`SECURITY.md` / `CONTRIBUTING.md` for the trust model and change rules.

## Release

```sh
npm pack   # build the tarball
```

## License

MIT
