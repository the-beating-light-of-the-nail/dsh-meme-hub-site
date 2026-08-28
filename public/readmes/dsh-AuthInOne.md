# dsh-AuthInOne

English | [简体中文](README.zh-CN.md)

![dsh-AuthInOne cover](https://raw.githubusercontent.com/Stormycry-cryp/dsh-AuthInOne/190ecc2d834ba06da008522684e689324a9c2706/docs/assets/cover.png)

dsh-AuthInOne is a DeepSeek Harness plugin for Provider login, API and custom OpenAI-compatible Provider setup, model switching, optional vision fallback for text-only models, token usage analytics, and cost tracking inside DSH's native **Models** and **Usage** settings.

OpenAI Codex uses browser OAuth with state, S256 PKCE, and a loopback callback. Kimi Code opens the Provider's complete authorization link backed by an RFC 8628 device flow; the link carries the short code, so the user normally only signs in and confirms. xAI Grok, Anthropic, GitHub Copilot, Command Code, Cursor, Google Antigravity, and Kiro are explicitly marked **Experimental compatibility**. Installed-Host validation reached each Provider's authorization boundary and stopped before user consent; mock/fixture tests cover exchange or polling, refresh rotation, denial, timeout, cancellation, logout, route activation, and secret redaction.

> **Alpha `v0.2.0-alpha.4`** · exact compatibility target: official DSH `47f9438` · the self-contained bootstrap uses the official DSH plugin CLI and returns Web on its original port · [release notes](docs/releases/v0.2.0-alpha.4.md) · MIT · community-maintained and not a DeepSeek or OpenAI product.

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 install --profile web
```

The command is owned by this package. It validates the running standard DSH Host, calls the official `dsh plugin` add path, then replaces that Host on the same URL. It does not require a patched DSH core, a manual profile edit, a second Web instance, or a temporary port. See [Install, upgrade, and remove](#30-second-install-upgrade-and-remove) for source-checkout and non-default-port forms.

If AuthInOne is useful to you, a [Star on GitHub](https://github.com/Stormycry-cryp/dsh-AuthInOne) is a welcome way to support the project.

Open DSH, then go to **Settings → Models** or **Settings → Usage**. The browser receives aggregated usage, redacted status, an authorization URL, and where required a user code. OAuth verifier, authorization code, device code, access token, and refresh token stay on the Host; the plugin never imports `~/.codex/auth.json`, OpenCodex state, cookies, browser storage, OTPs, or another product's credentials.

Agent instruction: **Run the documented `pnpm dlx … install --profile web` command as one operation. Do not split it into a manual `dsh plugin add` plus an improvised restart. The AuthInOne bootstrap must verify the listener, install through the official DSH plugin CLI, return the original URL, and report `ready` before UI acceptance. Never start a second Web instance, choose a temporary port, patch DSH, edit profile YAML, or read credentials. If the bootstrap rejects an unknown launcher or DSH owner fingerprint, stop and show that error instead of guessing.**

## Use this plugin when

- you want OpenAI Codex or Kimi Code login inside DSH, or knowingly opt into a labeled compatibility flow;
- you manage API-key or custom OpenAI-compatible Providers in DSH's native Models page;
- you switch the future-session default model without replacing DSH's per-session selector;
- you want a separately configured vision model to describe images only when the selected main model explicitly declares text-only input;
- you need reconstructable Provider/model/tool token usage and auditable calculated cost.

![DeepSeek Harness Models settings with Provider state and OpenAI Codex account authorization](https://raw.githubusercontent.com/Stormycry-cryp/dsh-AuthInOne/190ecc2d834ba06da008522684e689324a9c2706/docs/assets/models-dark-desktop.png)

![DeepSeek Harness Usage settings with token activity, model usage, and cost analytics](https://raw.githubusercontent.com/Stormycry-cryp/dsh-AuthInOne/190ecc2d834ba06da008522684e689324a9c2706/docs/assets/usage-light-desktop.png)

Additional real DSH captures: [Auth login dialog](docs/assets/auth-login-dark.png), [Models action area](docs/assets/models-auth-actions-dark.png), [dark Usage](docs/assets/usage-dark-desktop.png), [light narrow Usage](docs/assets/usage-light-narrow.png), [dark narrow Usage](docs/assets/usage-dark-narrow.png), and [second-precision time range](docs/assets/usage-time-range-light.png).

## Verified capabilities

| Capability | Status | Verification | Minimum DSH |
| --- | --- | --- | --- |
| OpenAI Codex browser account authorization | **Verified to user-confirmation boundary** | Real navigation reached `auth.openai.com`; mock issuer covers callback, state/PKCE, exchange, refresh, denial, expiry, cancellation, logout, revocation, and redaction | Official DSH `47f9438` with the bundled compat owner |
| Kimi Code authorization connection | **Experimental; verified to user-confirmation boundary** | Installed Host returned the complete Kimi authorization link without returning the Host-only device code; the UI does not ask users to re-enter a short code already embedded in that link | Official DSH `47f9438` with bundled compat owner |
| Seven compatibility account flows | **Experimental; verified to user-confirmation boundary** | xAI, Anthropic, GitHub Copilot, Command Code, Cursor, Antigravity, and Kiro each reached their expected authorization boundary; mocked completion registers and later disposes the corresponding model route | Official DSH `47f9438` with bundled compat owner |
| Provider subscription quota | **Best effort where upstream data exists** | Codex, Kimi, xAI, Anthropic, Cursor, and Antigravity have token-free Remote projections; the Models page omits the quota block when the upstream response is missing, incomplete, unsupported, or cannot yield a reliable percentage | Official DSH `47f9438` with bundled compat owner |
| Plan/API presets | **Available with vendor limits shown** | OpenAI, xAI, Gemini, Anthropic, Kimi Code, GLM Coding Plan, and ModelStudio/Qwen presets write credentials through DSH; GLM and Qwen usage restrictions remain visible | Official DSH `47f9438` with bundled compat owner |
| DeepSeek API-key Provider and live model call | **API-key only** | Native Provider remained connected; a real DeepSeek call populated Usage without exposing the key | DSH `0.1.0-rc.6` |
| Custom OpenAI-compatible Base URL, headers, model mapping | **Native DSH capability** | AuthInOne preserves the native Models cards and reads their public Provider projection | DSH `0.1.0-rc.6` |
| Future-session default model and connection test | **Verified** | Models contribution and Host/Remote route exercised in the installed Web profile | Official DSH `47f9438` with bundled compat owner |
| Vision fallback for text-only main models | **Verified** | PNG/JPEG/WebP/GIF use DSH `ImageBlock` references; multi-image, native multimodal pass-through, disabled fallback, failure, resume, and fork paths have keyless coverage | Official DSH `47f9438` with bundled compat owner |
| Cross-session Usage and cost analytics | **Verified** | Real DSH session logs rebuilt 26,383 Token into KPI, heatmap, model, Provider, bucket, and cost projections | DSH `0.1.0-rc.6` |
| Usage navigation icon | **Verified** | The bundled generic owner projects a keyed icon seat; AuthInOne contributes a 16 px three-bar `currentColor` icon and unknown sections retain the native fallback | Official DSH `47f9438` with the bundled compat owner |

### Account-login support matrix

| Provider | Flow | Stability | Authorization boundary verified | Refresh/logout/model route | Quota |
| --- | --- | --- | --- | --- | --- |
| OpenAI Codex | Browser OAuth, state + S256 PKCE + loopback | Stable | `auth.openai.com` | Yes / Yes / Yes | Primary and secondary windows, best effort |
| Kimi Code | Complete authorization link backed by RFC 8628 | Experimental | `www.kimi.com` | Yes / local logout / Yes | Best effort |
| xAI Grok | Device login | Experimental | `accounts.x.ai` | Yes / Yes / Yes | Weekly or monthly, best effort |
| Anthropic | Browser/manual compatibility login | Experimental compatibility | `claude.ai` | Yes / local logout / Yes | Best effort |
| GitHub Copilot | Device login | Experimental compatibility | `github.com` | Yes / local logout / Yes | Not exposed |
| Command Code | Browser loopback compatibility login | Experimental compatibility | `commandcode.ai` | Refresh via returned account credential / local logout / Yes | Not exposed |
| Cursor | Browser PKCE compatibility login | Experimental compatibility | `cursor.com` | Yes / local logout / Yes | Best effort |
| Google Antigravity | Browser PKCE compatibility login | Experimental compatibility | `accounts.google.com` | Yes / local logout / Yes | Best effort |
| Kiro | Builder ID device login | Experimental compatibility | `view.awsapps.com` | Yes / local logout / Yes | Not exposed |
| Qwen account OAuth | Discontinued | Unsupported | No start action | No | No |

“Local logout” means the plugin deletes its DSH credential and unregisters the model route when the observed compatibility protocol exposes no reviewed revoke endpoint. The browser never receives the stored credential. Stability labels describe implementation risk; they do not imply Provider sponsorship or certification.

## 30-second install, upgrade, and remove

Install or upgrade the immutable tag with the package-owned bootstrap:

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 install --profile web
```

The bootstrap discovers the single listener at `http://127.0.0.1:3080/`, verifies that it is a standard DSH Host, checks the exact supported DSH owner artifacts, invokes the official DSH plugin add command, and schedules a detached same-port replacement. The install command returns before the old Host stops; the browser may disconnect briefly, then the same URL must return.

For a non-default loopback port, provide the exact current URL:

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 install --profile web --url http://127.0.0.1:3090/
```

When DSH runs from a source checkout, the bootstrap normally infers that checkout from the listener working directory. An operator may make it explicit:

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 install --profile web --source-root /path/to/deepseek-harness
```

Inspect the detached handoff after the URL returns:

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 status --profile web
```

Remove the plugin through the same self-contained path:

```sh
pnpm dlx github:Stormycry-cryp/dsh-AuthInOne#v0.2.0-alpha.4 uninstall --profile web
```

The bootstrap only supports a credential-free loopback HTTP origin and a standard DSH launcher: an installed `dsh` executable or an explicit/inferred DSH source root. Automatic listener verification currently supports macOS and Linux and requires `lsof`. Ambiguous ports, unrelated listener processes, unknown owner artifacts, and unsupported launch provenance fail before the Host is stopped. It never falls back to another port. Owner-only restart status is written under the selected profile without environment values or credentials.

The official DSH CLI still owns the profile dependency and Bundle row. Do not copy `lib/`, create a workspace link, edit profile YAML, or apply the patch by hand. Removal unloads the page, Models contributions, Remote namespace, Host service, styles, and listeners. It intentionally preserves DSH sessions, plugin settings, and credential references; data deletion is a separate explicit action. The exact lifecycle and failure behavior are documented in [Self-contained installer and same-port restart](docs/design/self-contained-installer.md).

## Models and authentication

DSH's native Provider cards remain the only place to add, edit, or remove an API-key Provider. They own custom Base URLs, request headers, protocol choice, model mappings, and endpoint model discovery. AuthInOne adds a compact connection/default-route projection, a full-width **Add Auth login** action, and an **Add Plan / API Key** action above the two native add-Provider buttons. Per-session switching stays in DSH's conversation model selector.

The Models summary contains configured API/Plan/custom Providers and persisted Auth accounts only. The Auth catalog stays in the Add Auth login dialog; cancelled, failed, expired, and never-started entries do not create placeholder cards. A connected account refreshes the summary immediately, and Auth instances use their model adapter and logout flow instead of the generic Base URL probe.

Every Auth entry uses the same Host transaction surface: start, redacted status, cancel, optional one-time input, refresh, logout, and disposal. Browser/loopback flows keep state and PKCE verifier in the Host. Device flows keep the device code in the Host and expose only the verification URL and user code. A successful credential is written through DSH credentials before its model adapter is registered; terminal refresh failure or logout unregisters the route. Cancellation during a pending write compensates by deleting the credential. Remote revocation is bounded and best effort after local deletion.

OpenAI Codex protocol values were checked against OpenAI's public Codex sources for the [login server](https://github.com/openai/codex/blob/main/codex-rs/login/src/server.rs), [auth manager](https://github.com/openai/codex/blob/main/codex-rs/login/src/auth/manager.rs), and [PKCE helper](https://github.com/openai/codex/blob/main/codex-rs/login/src/pkce.rs). Kimi device polling follows RFC 8628 pending and `slow_down` semantics. Compatibility entries use reviewed Provider/public-client behavior and remain labeled Experimental.

The Plan/API action includes OpenAI API, xAI API, Google Gemini API, Anthropic API, Kimi Code subscription keys, GLM Coding Plan, and ModelStudio/Qwen Coding Plan. GLM and Qwen presets retain the vendor's supported-tool or interactive-use restrictions. API keys are a separate connection method and never count as account Auth.

The connection test calls the configured OpenAI-compatible `/models` endpoint from the Host. It rejects redirects before a credential-bearing request can reach another origin and incrementally caps response bytes. The Client receives only success, latency, model ids, or a sanitized failure category; it never receives request headers, upstream response bodies, or credentials.

## Vision fallback

Vision fallback is off by default under **Settings → Models**. Choose an active Provider and a model whose DSH adapter explicitly declares `image` input, then enable and save it. The fallback runs only when the main model explicitly omits image capability; a main model that declares image input receives the original request unchanged, and unknown capability is not silently treated as text-only.

For a text-only main model, the plugin records the exact DSH attachment references, fallback route, prompt version, result, and provider-reported usage as ordinary durable DSH messages with plugin provenance. It then replaces image blocks only in the provider-bound main request with the recorded textual description. Resume and fork reuse that recorded result; switching the fallback route affects new images, not already-described history.

Supported inputs are exactly DSH's version-one raster formats: PNG, JPEG, WebP, and GIF. The feature does not accept audio, video, PDF, image generation, browser object URLs, host paths, or plugin-owned base64 storage. DSH attachment storage owns the bytes and verifies them before an adapter reads them. Provider adapters resolve credentials through DSH Host credentials; AuthInOne never receives a credential in the vision settings RPC.

Successful auxiliary calls appear separately as **Vision-assist calls** and **Vision-assist Token** while retaining their actual Provider/model route. Missing provider usage remains unknown, and a missing price remains unpriced. A failed or credential-less fallback does not call the text-only main model with an unusable image request; it returns a recoverable `VISION_FALLBACK_FAILED` result and keeps upstream response details out of the session log.

## Usage filters and accounting

- Time, Provider, and output-price filters share one query context and drive every KPI, heatmap point, ranking, Token bucket, and cost value.
- Time is an inclusive local `YYYY-MM-DD HH:mm:ss` range in the displayed IANA timezone. The Host converts it to a deterministic UTC `[start, endExclusive)` query. Shortcuts fill the last 7, 15, or 30 days without closing the editor.
- Output-price bands use only `outputTokensPerMillion` in USD per 1M output Token. The disjoint bands are `[0,1)`, `[1,5)`, `[5,15)`, `[15,+∞)`, and unpriced. Missing/non-USD rows are unpriced; there is no silent currency conversion.
- Refresh keeps the active filters. Failed refreshes remain visible and do not replace the last good result.
- Daily Token activity always renders the latest 365 dates as a seven-row calendar. Dates without matching calls remain visible as empty cells; weekly and cumulative modes keep their existing aggregation semantics.
- Model calls use their actual logged event time. Tool calls are a separate dimension. DSH does not log an authoritative owner plugin for every tool call, so the UI reports durable tool names and does not invent plugin attribution.
- Total Token is uncached input + output + cache read + cache write. Reasoning is shown separately because some Providers already include it in output. Missing buckets remain unknown.
- Token values below 1M use locale grouping; 1M to below 1B use `M`; 1B and above use `B`; exact values remain in title and accessible labels.

The built-in `deepseek-usd-2026-08-14` catalog contains only DeepSeek-V4-Flash and DeepSeek-V4-Pro USD rows verified from the [official DeepSeek pricing page](https://api-docs.deepseek.com/quick_start/pricing) on 2026-08-14. Every row carries a source URL, verification/update date, effective date, currency, and explicit token-bucket rates. Missing prices remain unknown or partial, never a forged zero or another Provider's price.

## Security and data boundaries

AuthInOne creates no separate database. Analytics, including vision-assist provenance and provider-reported usage, rebuilds from DSH sessions; non-sensitive overrides use the plugin's DSH settings namespace; OAuth and API credentials stay in DSH credentials. Image bytes stay in DSH attachment storage and are never copied into plugin settings. The plugin does not scan user homes, browser stores, keychains, Codex/OpenCodex files, `.env` files, or unrelated databases.

Authorization URLs and device user codes are public instructions for the current login transaction. The Remote DTO has no verifier, authorization code, device code, access token, refresh token, raw identity, upstream body, or credential value. Tests assert those fields do not cross Remote or logs. Screenshots contain no authorization URL, account, token, user code, or API key.

Provider responses have both time limits and incremental byte limits. Credential-bearing connection tests refuse redirects. The alpha.2 security diff scan reviewed 74 changed/added artifacts, found two medium-severity network-boundary issues, and verified both fixes with Node 24 reproductions and focused tests before release.

## Compatibility

| DSH environment | Host/Usage | Models status/default | Add Auth login | Usage icon |
| --- | --- | --- | --- | --- |
| Official DSH `47f9438`, one standard AuthInOne add | Available | Available | Available | Three-bar plugin icon |
| Unknown/new DSH owner artifacts | Installation fails loud | Not mounted | Not mounted | Not mounted |
| Plugin removed | Absent | Native page only | Absent | Absent |

Official DSH `47f9438` does not expose the three generic composition seats needed inside Models and the Settings navigation. The package therefore carries exact-47f derivatives of the official Settings General and Models runtime owners. Its Bundle patch disables only those two official rows and mounts the compatible owners from the same AuthInOne package; their only additions are `settings.models.insights`, `settings.models.actions`, and a keyed `settings.section.icon` projection. Auth, Provider, Usage, and vision business code remains in separate AuthInOne registrations.

The Host checks the exact official owner versions and client SHA-256 fingerprints before creating plugin state, while the Client rejects already-declared seams. A changed or native-seam host fails with `AUTH_IN_ONE_COMPAT_UNSUPPORTED_DSH` instead of being silently replaced or double-registered. Removal drops both replacement rows with the Bundle layer and automatically restores the official owners. There is no DOM patch, `--patch` overlay, manual profile edit, or DSH checkout change. DeepSeek's MIT notice and the exact source provenance are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

See [Architecture and plugin boundary invariants](docs/architecture.md) for plugin-owned code, the exact core seam allowance, lifecycle disposal, safe degradation, and boundary gates.

## What this plugin does not claim

- It is not an official DeepSeek, OpenAI, or model-provider product and does not imply endorsement.
- It does not claim every compatibility login is a stable or Provider-endorsed integration. Seven entries are explicitly Experimental, and Qwen account OAuth is discontinued and unavailable.
- It does not replace Models business behavior, the attachment pipeline, session log, or model selector; on exact DSH `47f9438` it replaces the two Settings owner rows with source-derived compatible owners so the native page behavior plus generic seats can be delivered by one Bundle.
- It does not infer that a model supports or lacks vision when its adapter publishes no modality metadata.
- It does not extend image understanding to audio, video, PDF, or image generation.
- It does not fabricate missing Token buckets, prices, currency conversion, tool ownership, or a successful login.

## Local development

Use Node `^22.19` or `>=24` and the locked pnpm project:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
DSH_SOURCE_ROOT=/path/to/deepseek-harness pnpm verify:boundaries
pnpm build
pnpm pack --dry-run
```

`lib/` is committed because GitHub installs do not run a build. The package has no `prepare` script and requires no install-time lifecycle permission.

## Provenance and licenses

AuthInOne business logic, credential representation, settings fields, tests, README prose, and product interaction copy were independently written for this repository. The compatibility owner runtime is an explicitly attributed MIT derivative of the official DSH `47f9438` Settings General and Models sources; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The local OpenCodex source was read only for responsibility and failure-state comparison; details are in the [clean-room comparison](docs/design/opencodex-auth-comparison.md) and [alpha.2 provenance audit](docs/provenance.md).

The following repositories were used only for capability collision and public seam research: [usage-report](https://github.com/csiroqa/dsh-plugin-usage-report), [openai-codex-auth](https://github.com/yoke233/dsh-openai-codex-auth), [codex-provider](https://github.com/Hu9956/dsh-codex-provider), [polyglot](https://github.com/Jesse-njx/dsh-polyglot), [usage-meter](https://github.com/cute-baobao/dsh-usage-meter), [cost-ledger](https://github.com/suimi8/dsh-cost-ledger), and [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui). No source, README text, CSS, component structure, schema, or tests were copied or vendored from them.

Runtime dependency: Zod (MIT). Build-time Provider transport dependency: `@earendil-works/pi-ai` 0.82.1 (MIT), bundled into the committed Host artifact and not installed into the DSH profile. Cursor compatibility uses `@cursor/sdk` 1.0.24 under the Cursor SDK license and Terms of Service; it is bundled into the Host artifact and remains Experimental. Development tools include React, tsdown, Vitest, and Testing Library (MIT), TypeScript (Apache-2.0), and Lightning CSS (MPL-2.0). This repository is licensed under [MIT](LICENSE).

DeepSeek, OpenAI, Codex, and other Provider names and marks belong to their respective owners. Their appearance describes compatibility and does not imply sponsorship, certification, or endorsement.
