# Codex Switch

[![npm version](https://img.shields.io/npm/v/dsh-codex-switch?label=npm&color=cb3837)](https://www.npmjs.com/package/dsh-codex-switch)

English | [中文](docs/README.zh.md)

Multi-account Codex for DeepSeek Harness, powered by your ChatGPT subscription.

## What it does

- Connects ChatGPT accounts with OAuth.
- Shows each account's 5-hour and weekly limits, and the reset time of every window that has started.
- Redeems banked rate-limit resets granted by OpenAI, right from the account card.
- Warms up an account on request, to start a window that has not run yet.
- Switches accounts manually or automatically.
- Adds Codex models to the Harness model picker.
- Optionally enables Codex search and `view_image`.

## Install

```sh
dsh plugin --profile web add dsh-codex-switch@alpha
dsh web
```

For pnpm 9:

```sh
dsh plugin --profile web add -w --config.auto-install-peers=false dsh-codex-switch@alpha
```

## Set up

1. Open **Settings → Plugins → Plugin configuration → Codex Switch**.
2. Select **Sign in with ChatGPT** and add your accounts.
3. Choose **Manual** or **Automatic**, then select a Codex model.

| Mode | Behavior |
|---|---|
| Manual | You choose the Current account. |
| Automatic | Codex Switch uses Available accounts by Account order. |

Search and `view_image` are disabled by default. Codex Switch does not change your default model or global search provider.

## Quota windows

Codex Switch treats remaining capacity and reset lifecycle as separate facts. A zero-use 5-hour window shows **Starts after first use** rather than a meaningless countdown. The weekly lifecycle is independent: a stable weekly reset can keep counting down even while the 5-hour window is idle or visually full. Moving full-window projections are never presented as reset anchors. If OpenAI reports usage without a usable reset time, the card says **Reset time unavailable**.

**Warm up** reads that account's authorized Codex model list, then sends one minimal request for the core pool and each eligible additional model pool that still needs activation. It consumes a small amount of that account's quota, so it asks for confirmation and never runs on its own — not on refresh, sign-in, automatic switching, or background polling. Acceptance is not proof activation succeeded: Codex Switch re-reads usage, and keeps offering an explicit retry until positive use and at least five elapsed minutes prove the relevant window is running.

## Commands

```sh
dsh plugin --profile web exec dsh-codex-switch status
dsh plugin --profile web exec dsh-codex-switch doctor
dsh plugin --profile web exec dsh-codex-switch accounts list
```

Credentials are stored under `$DSH_HOME/openai-codex/credentials/`. Removing the plugin does not delete them; use **Sign out** to remove an account.

> ChatGPT subscription access is not an OpenAI API key. Available models and limits are controlled by OpenAI.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run check
```

## License

[Apache-2.0](LICENSE). Codex Switch is maintained by CHAKEW and retains upstream work by Frank Song and Yan-Zero. Third-party notices and modification history are documented in [NOTICE](NOTICE) and [MODIFICATIONS.md](MODIFICATIONS.md).
