# dsh-plugin-midscene

English | [中文](README.zh.md)

[![CI](https://github.com/ciky20171114/dsh-plugin-midscene/actions/workflows/ci.yml/badge.svg)](https://github.com/ciky20171114/dsh-plugin-midscene/actions/workflows/ci.yml)

AI-driven UI automation for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH), powered by [Midscene](https://midscenejs.com). The model sees the screen, locates elements by natural-language description, and acts on real targets — a real Android device or a real Chrome browser.

One capability seam (`ctx.midscene`), two providers, two tools:

| | Provider entry | Tool | Target |
|---|---|---|---|
| Android | `dsh-plugin-midscene/android` | `android_ui` | one ADB-connected device |
| Web | `dsh-plugin-midscene/web` | `web_ui` | the active page of an already-running Chrome |

Each tool is a **single tool with an `action` parameter** (like `str_replace_editor`): the model picks an action (`tap` / `act` / `input` / `query` / `assert` / `boolean` / `back`) and the tool dispatches internally — no tool-surface bloat.

## Requirements

- DSH (`dsh` CLI) with a profile
- Android: `adb devices` shows the device
- Web: Chrome started with `--remote-debugging-port=9222 --user-data-dir=<dir>`; the provider **connects, never launches**
- A Midscene-compatible vision model, configured through environment variables (see [Model configuration](#model-configuration))

## Install

```sh
dsh plugin --profile mysetup add dsh-plugin-midscene
```

The bundle's default layer registers the two tools. They read `ctx.midscene` opportunistically, so they appear even before a provider is configured — calling one without a provider fails with a message naming the missing row.

Then add **exactly one** provider row to your profile's `cordis.patch.yml` (`~/.dsh/profiles/mysetup/cordis.patch.yml`; both providers cannot own `ctx.midscene` in the same context):

### Android

```yaml
- insert:
    - id: midscene-android
      name: dsh-plugin-midscene/android
      config:
        deviceId: ''            # empty: first device from getConnectedDevices()
        aiActionContext: ''     # free-form context for aiAct planning, e.g. app conventions
```

### Web

```yaml
- insert:
    - id: midscene-web
      name: dsh-plugin-midscene/web
      config:
        browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/<id>'
        aiActionContext: ''
```

Ready-to-paste provider rows live in [`examples/`](examples/).

Get the endpoint from `http://127.0.0.1:9222/json/version` → `webSocketDebuggerUrl`. Note the id changes every time that Chrome restarts — update the row and restart dsh.

On teardown the provider destroys its agent and then **`disconnect()`s — never `close()`s** — the browser: the Chrome process belongs to your deployment and keeps running.

Start:

```sh
dsh --profile mysetup          # add --port 3081 if 3080 is occupied
```

## Install troubleshooting

**`dsh plugin add` fails with `ERR_PNPM_IGNORED_BUILDS`** naming `sharp` / `@ffmpeg-installer/linux-x64`: pnpm ≥ 10 blocks those transitive install scripts (pulled in by `@midscene/*`) until they are declared. Fix: open `~/.dsh/profiles/<name>/pnpm-workspace.yaml`, set the keys pnpm printed under `allowBuilds` to `false` (the plugin works without them — flip to `true` only if you want the sharp/ffmpeg binaries for real-device capture), then re-run the `add` command. This is a one-time fix per profile.

## Tool reference

`android_ui` and `web_ui` share one shape:

| `action` | Other parameters | Result |
|---|---|---|
| `tap` | `prompt` (element description) | ack |
| `act` | `prompt` (goal description) | ack + the agent's own result text, if any |
| `input` | `prompt` (element) + `value` (text to type) | ack |
| `query` | `demand` (what to extract) | extracted JSON |
| `assert` | `prompt` (assertion) + optional `msg` | pass/fail + optional thought |
| `boolean` | `prompt` (yes/no question) | true/false |
| `back` | — | ack (Android: system back; Web: history back) |

Cross-field rules the schema cannot express (e.g. `value` required for `input`, `demand` for `query`) are enforced in `execute` with named error messages. A **failed assertion is a successful `pass: false` result** — the error path is reserved for infrastructure failures (device gone, websocket refused).

## Model configuration

Midscene's vision model is configured through `@midscene/*`'s own conventions — environment variables, not DSH's `ctx.llm`:

```sh
export MIDSCENE_MODEL_NAME=glm-4.6v
export MIDSCENE_MODEL_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
export MIDSCENE_MODEL_API_KEY=<your key>
export MIDSCENE_MODEL_FAMILY=glm-v
```

(Any OpenAI-compatible multimodal endpoint works — set the matching variables.)

## Design boundary: no policy, no recovery

The providers are deliberately thin transports: no retry, no precondition checks, no automatic recovery from unexpected UI state (stray popups, unwanted navigation, re-login). Callers that need that behavior build it on top — for example a constraint/harness layer that checks app state before each write action.

## Known limitations

- **One target per provider instance** — one device or one browser per context; fan out with isolated compositions.
- **No reconnect** — a mid-session disconnect surfaces as a rejected call.
- **Pinned SDK versions** — `@midscene/android` / `@midscene/web` at exactly `1.11.0`; upgrading is a deliberate version bump.
- **`puppeteer` is a peer** (web) — resolved by your deployment's pnpm; Chrome itself is supplied by the deployment, never downloaded by this plugin.

## Development

```sh
git clone https://github.com/ciky20171114/dsh-plugin-midscene
cd dsh-plugin-midscene
pnpm install   # native/browser install scripts are denied by default; tests mock the SDKs
pnpm test      # wiring-only: mocked @midscene/*, puppeteer, stub seam behind the real tool registry
pnpm build     # tsc emit to lib/ (also runs as `prepare` on git installs)
```

Layout:

```
src/service.ts   MidsceneService definition — the ctx.midscene seam (7 operations)
src/android.ts   Android provider (AndroidDevice + AndroidAgent, ADB)
src/web.ts       Web provider (puppeteer.connect + PuppeteerBrowserAgent, connect-only)
src/tool.ts      android_ui + web_ui tools (one shared definition, action branching)
tests/           31 wiring tests — never a real device or browser
```

Install a local checkout into a profile while developing:

```sh
dsh plugin --profile dev add /path/to/dsh-plugin-midscene
```

## Community and support

Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/ciky20171114/dsh-plugin-midscene/discussions). This repository carries the `dsh-plugin` topic for discoverability.

## License

MIT
