# dsh-vision-fallback

[English](README.md) | [中文](README.zh.md)

Silent vision enhancement for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness): keep your real text-only main model (e.g. `deepseek-v4-flash`), and let chat images "just work" — every image you drop, paste, or reference in the chat box is automatically sent to a fixed vision model, converted into a factual text observation, and handed to your main model as hidden context. The UI keeps showing your original image; no model groups, no model switching, no extra tools.

Compatible with the current DSH Store window: `0.1.2-alpha.3`, `0.1.2-alpha.4`, and `0.1.2-alpha.5`. Durable MCP / ACP image attachments and nested images forwarded by PTC Mode use the same vision bridge. When enabled, the plugin intentionally keeps advertising image input; otherwise the chat composer rejects the image before it can reach the bridge.

## Why

- DeepSeek V4 Flash / Pro and other strong coding models are **text-only**: dropping an image into the chat box fails with "model does not support image input".
- Existing "vision tool" plugins require saving images as files and invoking a `see_image(path)` tool — clunky, and the main model still can't see chat attachments.
- This plugin bridges the gap at the request layer, so **chat-box images work exactly like you expect**, regardless of which main model you pick in the model picker.

## How it works

```
You drop/paste an image ──► chat attachment (kept visible in UI)
        │
        ▼
agent/pre-step ──► image + current question + recent context
        │                    │
        │                    ▼
        │            fixed vision model (OpenAI-compatible /chat/completions)
        │                    │  factual text observation
        │                    ▼
        └──► model-only surface replacement ──► main model (text only)
```

1. The plugin overrides the pre-send capability check, so a text-only model can receive image-bearing messages.
2. `agent/pre-step` detects images in the incoming turn, and sends the image, the latest user question, and recent conversation context to the configured vision model.
3. Your original image stays in the UI as a normal chat attachment.
4. A **model-only surface replacement** swaps the image for the vision observation before the request reaches the main model.
5. Switching the main model (DeepSeek, Kimi, MiniMax, ...) never changes the fixed vision model.

### MCP / ACP / PTC images

DSH `0.1.0-rc.7` persists images produced by MCP, ACP, and PTC as durable attachments, then exposes them as core `image` content blocks. This plugin recursively handles images in ordinary messages, `tool-result`, and nested `tool-result` content while preserving the original text/image order:

- MCP / ACP durable attachments are read by `attachmentId`, not temporary file paths;
- nested PTC subtool images are converted into vision observations;
- multiple images are sent to the vision model in their original order;
- only the model-visible surface is replaced, so the original UI image remains intact.

The image-capability override is an intentional entry-point compatibility layer. It does not claim that the main model has native visual reasoning; it lets the image reach DSH so the bridge can convert it into text context.

### DSH compatibility evidence

Verified on 2026-09-03 with Node.js `24.16.0` and a separate disposable `DSH_HOME` for each release:

| DSH release | Local-path install | `--dump-config` | Authenticated cold start | Uninstall |
| --- | --- | --- | --- | --- |
| `0.1.2-alpha.3` | passed | passed | HTTP 200 | passed |
| `0.1.2-alpha.4` | passed | passed | HTTP 200 | passed |
| `0.1.2-alpha.5` | passed | passed | HTTP 200 | passed |

The Profile operations use the official CLI with `plugin --profile web add -w <local-path>` and `remove -w dsh-vision-fallback`. The runtime fix does not mutate the deep-frozen `llm/stream` request introduced by current DSH builds; compaction creates a copied request and performs one guarded nested dispatch.

## Install

### From npm / local checkout

```sh
# npm (if published) or a local checkout directory
dsh plugin --profile web add dsh-vision-fallback
# or: dsh plugin --profile web add /path/to/dsh-vision-fallback
```

### From source

```sh
git clone https://github.com/1HelloMan1/dsh-vision-fallback.git
cd dsh-vision-fallback
pnpm install --config.minimumReleaseAge=0   # pre-release peers may need the release-age flag bypassed
pnpm test                                    # node --test test/*.test.mjs
dsh plugin --profile web add "$PWD"
```

Then verify and restart:

```sh
dsh --profile web --dump-config   # expect a "# == dsh-vision-fallback" layer
# restart `dsh web` (patch/bundle layers are not hot-reloaded)
```

> The plugin is also compatible with any profile (headless, TUI) — it registers on the host plane.

## Configuration

Two ways, both live (no restart needed after saving):

### Web settings page

Open **Settings → 视觉增强 / Vision Enhancement** in the DSH web UI. It exposes only:

| Field | Default | Meaning |
|---|---|---|
| Enabled | `true` | Master switch |
| Vision model | `mimo-v2.5` | OpenAI-compatible `model` |
| Base URL | `https://opencode.ai/zen/go/v1` | The plugin appends `/chat/completions` |
| Credential ref | `OPENCODE_GO_API_KEY` | Key resolved from the DSH credential store (never written to env files) |
| Max tokens / Timeout / Max bytes | `1536` / `60000` / `15MB` | Vision request limits; oversized images fail |
| Recent context | `includeRecentContext: true`, `contextMessages: 6`, `contextMaxChars: 6000` | How much recent chat to attach for the vision model |
| Prompt | (Chinese detailed-analysis prompt) | Analysis instruction; the user's question is appended automatically |
| Tag result | `true` | Prepend `【视觉观察：<model>】` to the observation |

### settings.yaml

```yaml
vision-fallback:
  enabled: true
  model: mimo-v2.5
  baseURL: https://opencode.ai/zen/go/v1
  apiKeyRef: OPENCODE_GO_API_KEY
  maxTokens: 1536
  timeoutMs: 60000
  maxBytes: 15728640
  includeRecentContext: true
  contextMessages: 6
  contextMaxChars: 6000
  prompt: "请分析这张图片..."
  tagResult: true
```

The API key is resolved through the DSH **credentials** system (`~/.dsh/.credentials.yaml`), with `process.env[apiKeyRef]` as a fallback — it is never materialized into shell environment files by the plugin.

## Security & privacy

- The config route is loopback-only and same-origin checked; request bodies are size-limited and schema-validated.
- The vision model gets **no tools**, **no system prompt**, **no execution permission** — only the image, the question, and recent text context.
- Observations are delivered as model-only surface replacements; your original image is never altered in the UI.
- Image reads go through the DSH attachment service (sandbox/observation-policy aware); the vision request carries the official `attributionHeaders()`.

## Usage records (usage.jsonl)

With `recordUsage` enabled, every real vision call (success or failure) appends one JSON line to
`<dshHome>/vision-fallback/usage.jsonl` (override via `usageLogPath` in the settings page), consumed by usage-dashboard.
Fields:

| Field | Meaning |
| --- | --- |
| `ts` | Call start time (epoch ms) |
| `durationMs` | Response latency of this call (ms) |
| `kind` | Always `"vision"` |
| `status` | `"ok"` success / `"error"` failure |
| `model` | Vision model name |
| `inputTokens` / `outputTokens` | Input / output tokens |
| `cacheReadTokens` | Cached input tokens served |
| `error` | Error message (failure entries only) |
| `imageName` / `mediaType` / `imageBytes` | Image filename / media type / byte size |
| `imageIndex` / `imageTotal` | This image's position / total images in the request |

Reusing a remembered observation (observations.json) does **not** append a line — this file counts real external vision calls only.

### Observation cache semantics

Observations are keyed by **the image's occurrence in a session** (session id + message id):

- The same image at the **same message position** processed again (restart recovery, replay, compaction) → reused, no re-recognition;
- The same image at a **new position in the session** (new turn, main model asking to "look again") → **re-recognized** with fresh context;
- Observations are **not** shared across sessions.

The cache is capped at 256 entries (LRU eviction); failed results are never cached.

### About image compression

In the current version, “compression” means **reusing an existing vision observation during conversation-context compaction**; it does not re-run vision analysis. The plugin does not yet resize, transcode, or quality-compress image files. Images above `maxBytes` fail explicitly instead of being silently changed. A future real image-compression feature should report the before/after byte counts and media type.

## Default vision route

- Model: `mimo-v2.5` · Endpoint: `https://opencode.ai/zen/go/v1/chat/completions` · Credential: `OPENCODE_GO_API_KEY`

Any OpenAI-compatible vision endpoint works (Zhipu GLM-4V-Flash, SiliconFlow Qwen-VL, vLLM, Ollama, ...) — just change `model`, `baseURL`, and `apiKeyRef` in the settings page.

## Relationship to the OpenCode ecosystem

The OpenCode community `opencode-see-image` hands a `filePath` + task `question` to a fixed vision model and returns text to the main model. DSH additionally performs a pre-send image-capability check, which this plugin also overrides, using DSH's official `agent/pre-step` and model-only surface replacement to keep the UI silent.

## Development

```sh
pnpm test    # node --test test/*.test.mjs
```

Structure:

```
dsh-vision-fallback/
├── package.json        # dsh.bundle + dsh.client manifests
├── cordis.patch.yml    # inserts the vision-fallback row
├── lib/index.js        # host plugin (pre-step bridge, config route, controller)
├── lib/client.js       # Web settings page ("视觉增强")
└── test/               # unit tests
```

## License

MIT
