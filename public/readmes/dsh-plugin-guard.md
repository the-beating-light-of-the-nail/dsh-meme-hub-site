# dsh-plugin-guard

One plugin, two surfaces. Static analysis only — never executes the target plugin.

| Surface | Tool | Job |
|---|---|---|
| Gate | `plugin_audit` | Static audit before install |
| Gate | `plugin_verify` | Hash + capability lock after install |
| Clinic | `plugin_peers` | Local fingerprint peers; `query` searches GitHub `topic:dsh-plugin` |
| Clinic | `plugin_detox` | Mechanical amputation, not an equivalent rewrite |

`plugin_peers`: `path` stays local (profile bundles). `query` hits GitHub `topic:dsh-plugin` + the curated list; argo only if those are thin. Override with `remote`. Remote hits are `verdict=unknown` — audit before install.

## Install

```sh
dsh plugin --profile web add github:taxueseek/dsh-plugin-guard
# restart dsh web
```

## Scoring

Start at 100; P0 −40, P1 −12, P2 −3. Any P0 or score < 40 → `block`. Any P1 or score < 75 → `warn`.

P0 is only auto-run + dangerous combo (`curl|bash`, secrets leaving the machine, eval of network content, install-script poison). `exec` inside a tool the model must click is P1.

## Not

- Not output redaction
- Not general SAST
- Does not prove a plugin is safe
- Detox does not keep the original behavior

## License

MIT
