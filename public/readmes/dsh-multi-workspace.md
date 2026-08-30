# dsh-multi-workspace

Multi-workspace sandbox for DeepSeek Harness (DSH).

Automatically grants file-write access to ALL registered workspaces — add a workspace in the UI, write to it immediately, no config needed.

## Problem

By default, DSH file sandbox only allows writes to one workspace directory (the session cwd). Writing to other directories requires sandbox escalation.

## Solution

This plugin reads the live workspace registry on every sandbox policy check and injects every registered workspace path as an additional writable root.

## How it works

Two layers:
1. Wraps sandboxPolicy.resolve() to attach workspace paths
2. Wraps fs.writeText/editText with retry fallback on each workspace root

## Limitations

- **Shell commands stay confined to the session workspace.** The multi-workspace
  widening applies to the fs tools only (layer 2 re-issues each denied write
  with the target workspace's root). The command sandbox seam
  (`@deepseek-ai/dsh-sandbox-local`, windows-acl / bwrap / seatbelt) reads only
  the single `policy.workspaceRoot`, so `pwsh` / bash writes outside the
  session workspace are still denied.
- **The fs fallback silently retries under `workspace-write`** without going
  through the approval flow. That is the plugin's intended "write immediately"
  behavior — make sure the registered workspaces are trusted.
- The wrapped `resolve()` must return a **plain object** (own
  `mode` / `workspaceRoot` / `sessionId`): executors spread the policy
  (`{ ...policy }`), and a prototype-based copy silently drops those keys,
  making the windows-acl runner fail with `--workspace undefined`
  (`SANDBOX_UNAVAILABLE`). `test/smoke.mjs` guards this regression.

## Installation

```
dsh plugin --profile web add github:somnusovis/dsh-multi-workspace

# Or from npm (once published)
dsh plugin --profile web add dsh-multi-workspace
```

Restart DSH web service and refresh browser.

## License

MIT