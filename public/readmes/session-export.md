# dsh-session-export

[English](./README.md) | [简体中文](./README.zh.md)

[![CI](https://github.com/JohnXu22786/session-export/actions/workflows/ci.yml/badge.svg)](https://github.com/JohnXu22786/session-export/actions/workflows/ci.yml)

Session export & compliance archiving for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`).

Turns any current or historical session into verifiable, **sanitized** archives in
multiple formats, manages them on disk, and gives you a compliance/traffic view —
all as a dependency-free [dsh bundle](#installation).

## Why

Exports are only useful for compliance or archival if they do not leak. This plugin
combines, in one bundle:

- **Deterministic redaction by default** — API keys, tokens, JWTs, `.env`-style
  lines, URL credentials and absolute file paths are masked *before* anything
  touches disk. The same input always yields the same output, and masked values
  carry a stable fingerprint so archives stay correlatable without leaking secrets.
- **Multiple formats** — a readable Markdown narrative, a machine-readable JSONL
  full record, and PDF (print-ready HTML plus optional headless-Chromium
  rendering).
- **Archive management** — exports are organized by session/date, discoverable,
  searchable, and deletable (with path-traversal guarding).
- **Compliance metadata** — every export embeds a header with session id, models,
  sanitization level, counts, and an optional SHA-256 content hash; a trend/audit
  view summarizes what was exported, when, and how sensitive it was.
- **No model dependency** — redaction is rule-based. An optional hook exists if you
  want to layer an LLM-assisted masker on top.

## Features

### 1. Session export
- Current or historical sessions, from the harness's own event log
  (`ctx.sessionPersistence` / `ctx.sessions`).
- Formats: `markdown`, `jsonl`, `pdf`, or `all`.
- Event-log folding is tolerant of unknown event types and payload shapes across
  harness versions.
- Large exports are split into numbered parts (with a `parts.json` manifest); long
  messages can be truncated in Markdown with an explicit marker (JSONL always keeps
  the full record).

### 2. Redaction (on by default)
| Rule | Description |
| --- | --- |
| `api-key` | `sk-…`, `pk-…`, `ghp_/gho_/github_pat_` (GitHub), `hf_`, `AKIA…`, `AIza…`, long base64-style tokens |
| `jwt` | `eyJ…` tokens |
| `high-entropy-token` | any 32+ char alphanumeric run |
| `env-value` | `KEY=value` assignment lines (e.g. pasted `.env`) |
| `bearer` | `Bearer`/`token` values |
| `url-credential` | `https://user:pass@host` |
| `absolute-path` | Windows drive / UNC / POSIX home paths — masked, or relativized to `<project-root>` when `pathMode: relative` |
| `email` | opt-in |
| `custom` | arbitrary user regexes |

All matched values are replaced with
`<redacted:<rule> sha256:<fingerprint>>` where the fingerprint is a salted SHA-256
(12 hex chars). Determinism + a configurable `salt` keep exports correlatable across
files and machines without exposing the secret: because the fingerprint is derived
from the secret value alone (not the rule label), the same secret gives the same hex
whether it was caught by the `env-value`, `api-key`, or `jwt` rule. The `env-value`
rule runs first, so a `KEY=sk-…` line is reduced to `KEY=<redacted:env …>` in one
step (masking the value token or quoted string while preserving surrounding prose
and commands) before token rules see it.

### 3. Archive management
```
<outDir>/
  sessions/<session>/<YYYY-MM-DD>/<YYYY-MM-DD>_<HHMMSS>-<tag>_<format>.<ext>
    <file>.meta.json       # one sidecar per export (see ArchiveEntry)
    <file>.parts.json      # present when the export was split
  archives.json            # searchable index (rebuilt from sidecars if lost)
```
Files are named with a process-unique tag so two exports in the same second never
overwrite each other. List/search by session, format, ISO date range, free-text
query, and limit; delete by archive id, file name, or relative path — strictly
confined to the archive root (path traversal is rejected). Index writes are
serialized in-process, so concurrent tool calls cannot lose records.

### 4. Compliance
Every export embeds a metadata header:
`plugin` (name, version), `session` (id, project, cwd, createdAt), `exportedAt`,
`model`s used, `sanitization` (enabled, level, fired rules, salt fingerprint),
event/message counts, optional `contentHash`, and warnings. An optional SHA-256 hash
over the sanitized transcript is included (`includeHash: true`).

Note: warnings that only become known while writing (large-export chunking, PDF
fallback) cannot be embedded in the already-rendered header; they are recorded on
the archive index entry + `.meta.json` sidecar and re-surfaced on tool results.

A **trend/audit view** (`/export-audit`) aggregates exports by day, format, session
and sanitization level.

### 5. Toolchain
- **Model-facing tools** (`ctx.tools`): `session_export`, `session_export_list`,
  `export_delete`, `sanitize_config`.
- **Human slash-commands** (`ctx.commands`): `/session-export`,
  `/session-export-list`, `/export-delete`, `/sanitize-config`, `/export-audit`.
- **Reusable library**: import the harness-independent core via the
  `dsh-session-export/core` subpath.

## Requirements

- Node.js 20+ (Node 24+ recommended for running the source `.ts` test suite directly).
- A DeepSeek Harness profile with the base bundle (provides `sessions`,
  `sessionPersistence`, `tools`, `commands`).

## Installation

This is a standard dsh **bundle**: an npm package whose `package.json` declares the
`dsh.bundle` manifest and ships a `cordis.patch.yml` patch layer plus an entry module
exporting `name`/`inject`/`apply`.

```sh
# from this repository
dsh plugin --profile demo add github:JohnXu22786/session-export
# or from npm once published
npm install -g dsh-session-export
```

The patch inserts one row:

```yaml
# cordis.patch.yml
- insert:
    - id: dsh-session-export
      name: dsh-session-export
      config:
        outDir: !!js dshHomePath('exports')
```

`outDir` defaults to `$DSH_HOME/exports` (i.e. `~/.dsh/exports`). Override any
setting by targeting the same row id in a later patch layer (config is a whole-row
replacement, per harness semantics).

## Configuration

```yaml
- id: dsh-session-export
  name: dsh-session-export
  config:
    outDir: !!js dshHomePath('exports')
    enabled: true
    defaultFormat: markdown        # markdown | jsonl | pdf | auto
    includeNotes: false            # include todo/command/feedback bookkeeping
    includeDocuments: true         # emit the document-tree appendix
    maxChunkBytes: 4194304         # split big exports (0 = never)
    maxMessageChars: 0             # truncate message display in Markdown (0 = never)
    prettyToolArgs: false
    includeHash: true
    redaction:
      enabled: true
      pathMode: mask               # mask | relative | off
      projectRoots: []             # e.g. ['C:\\Users\\you\\work']
      maskApiKeys: true
      maskEnvValues: true
      maskBearerTokens: true
      maskUrlCredentials: true
      maskAbsolutePaths: true
      maskEmails: false
      salt: ""                     # set a secret to harden correlatable fingerprints
      customPatterns:              # [{ pattern, flags?, replacement? }]
        - pattern: '\\d{4}-\\d{4}'
          replacement: '[CARD]'
      aiMaskEnabled: false         # layer a user-provided aiMaskFn on top
    pdf:
      engine: auto                 # auto | chrome | html
      chromePath: ""               # explicit chromium-family binary
```

## Usage

### Tools (for the model)

- **`session_export { format?, sessionId?, redact? }`** — export a session.
  Returns artifact paths plus a compliance summary. `redact: false` opts out for
  one-off exports.
- **`session_export_list { query?, sessionId?, format?, before?, after?, limit? }`**
  — list/search the archive.
- **`export_delete { target }`** — delete by archive id / file name / relative path.
- **`sanitize_config { action?, sample? }`** — `show` the active rules or `test` a
  sample string against them.

### Slash commands

```
/session-export [format] [--id=<session>] [--no-redact]
/session-export-list [query] [--format=<f>] [--limit=<n>] [--id=<session>]
/export-delete <id|path|filename>
/sanitize-config [--test <text>]
/export-audit
```

## PDF generation approach

`pdf` is optional and lightweight by design:

1. The session is rendered as a **print-ready, self-contained HTML** file (embedded
   CSS, `meta` CSP, no scripts, `@media print` rules).
2. With `pdf.engine: chrome` (or `auto`), the plugin drives a headless
   Chromium-family binary (`chromePath` or `CHROME_PATH`, then common install
   locations) via `--headless --print-to-pdf`.
3. If no browser binary is available, the export archives the HTML and reports a
   warning — open it and use your system "Print to PDF".

This avoids heavy PDF dependencies (no native renderer is shipped).

## Compliance hash

`contentHash` is `sha256` over the canonical JSON-Lines serialization of the
sanitized transcript (header excluded), so two exports of the same sanitized record
hash identically regardless of format.

## Development

```sh
npm install
npm test          # node --test over test/*.test.ts (needs Node 24+ for .ts)
npm run typecheck
npm run build     # tsc → dist/
```

Structure:

```
src/
  index.ts            # bundle entry: name / inject / apply
  commands.ts         # slash-command definitions
  tools.ts            # ctx.tools definitions + registration
  adapter/            # thin dsh<->core bridge (backend, types, defineTool)
  engine.ts           # export pipeline orchestration
  config.ts           # configuration shape + normalization
  core/               # harness-independent library (./core subpath)
    fold.ts           # event-log → transcript document
    redact.ts         # deterministic sanitization engine
    archive.ts        # on-disk archive, index, chunking, traversal guard
    render/           # markdown / jsonl / html / pdf
    meta.ts           # compliance header
    audit.ts          # trend/audit aggregation
    filenames.ts      # platform-safe names
    hash.ts           # sha256 / fingerprints
```

## License

[MIT](./LICENSE)
