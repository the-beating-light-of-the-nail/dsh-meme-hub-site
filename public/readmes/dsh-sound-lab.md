# dsh-sound-lab — Sound Lab

English | [中文](README.zh.md)

A DSH Web GUI **Sound Lab**: **pick a sound for each of the four triggers** (session end / options popup / permission request / stop), **generate AI character voice lines**, and **upload & manage your own sound library** — all set with a few clicks, no code needed; floating desktop pet (default) or round ball, 3 appearances, dual-persisted config.

> 🐋 Character reference: a fan-made project for **Angelina** from *Arknights*. The bundled sample sounds are Angelina's "hirari do～", "Huh?" and "AWAWA!" voice clips, for personal learning and entertainment only — **not for commercial use**.

## Install

Both methods work for **either** user type — Desktop users and `npx dsh web` users can use whichever they prefer.

**Option A — Setup installer (recommended, zero dependencies, works for both):**

1. **If dsh isn't running, start it once** (the Desktop app or `npx dsh web`) so its profiles get initialized — then **quit it** (the Desktop app or the `dsh web` server)
2. Download [dsh-sound-lab-Setup-1.3.2-x64.exe](https://github.com/miiaowuwu/dsh-sound-lab/releases/latest/download/dsh-sound-lab-Setup-1.3.2-x64.exe) and **double-click it**
3. The installer **restarts dsh automatically** — the floating **Angelina desktop pet** (default) means it's installed (falls back to the round ball automatically when no frames are bundled)

- **Update**: re-download the latest Setup exe and run it (restarts dsh automatically; older versions are overwritten automatically — no need to uninstall first, no conflicts)
- **Uninstall**: double-click [dsh-sound-lab-UnSetup-1.3.2-x64.exe](https://github.com/miiaowuwu/dsh-sound-lab/releases/latest/download/dsh-sound-lab-UnSetup-1.3.2-x64.exe) — it restarts dsh automatically when done

> Note (just how it works — no action needed): the installer deploys the plugin to `$DSH_HOME/plugins/dsh-sound-lab` and registers it into **every initialized profile** (web, desktop, …) via the official `dsh plugin` command, so all profiles share the same copy. If no dsh CLI is found, it auto-detects one (desktop bundled runtime → system npx → downloads Node.js); if dsh hasn't been initialized yet (no profiles), it runs `dsh web` once to initialize. On finish it **restarts dsh automatically**: for Desktop it **closes the running instance first, then launches it** (exactly like double-clicking the app — no terminal window, unaffected by closing the installer); when no Desktop app is detected (web environment) it **prompts you to restart the dsh web service manually**. Fully automated, no manual config edits.

**Option B — dsh CLI (needs Node.js, works for both):**

> If dsh isn't running yet, start it once first (`npx @deepseek-ai/dsh web`) so its profiles get initialized (`npm run setup` and the Option A installer do this automatically when uninitialized).
> Don't have dsh yet? Download the DeepSeek Harness Desktop app, or install Node.js (https://nodejs.org) and run `npx @deepseek-ai/dsh web`.

Pick **the one command** that matches how you run dsh — Desktop or web — and run **only that one** (choose 1 of 2):

```bash
# Desktop users —— run this one
npx @deepseek-ai/dsh plugin --profile desktop add dsh-sound-lab --config.minimumReleaseAge=0
```

```bash
# web users (dsh runs via `npx dsh web`) —— run this one
npx @deepseek-ai/dsh plugin --profile web add dsh-sound-lab --config.minimumReleaseAge=0
```

Then **restart** dsh (or just start it if it isn't running):

```bash
npx @deepseek-ai/dsh web
```

> Development convenience: `npm run setup` auto-detects all local profiles and registers this plugin into each of them; `npm run setup:deploy` deploys a copy to `$DSH_HOME/plugins` and points every profile at it (release/fixed-use mode). Add `--profile <name>` (e.g. `node tools/install.mjs --profile web --unify`) to operate on a single profile only; `node tools/install.mjs --npm --start` installs from the npm package and auto-starts the matching side when done (Desktop window for desktop / web service + browser for web).

## Features

- **Floating desktop pet** (default, Arknights Angelina animation): idle (default standing) / greeting on click / move while dragging / docks at left·right·top·bottom edges (peek left·right / sleep top·bottom) / falls asleep after 90s idle / staff idle while a session runs / celebrates on session end / confused on options popup & permission request / falls down on stop & errors (holds the last frame, recovers on interaction); draggable, edge-docking, click to open the settings dialog; position is persisted, defaults to the left side
  - **Docking & hiding**: top dock flips the pet upside-down and hides 80% (only 20% visible), bottom dock doesn't hide at all, left/right docks hide 40% and rotate 30° toward the screen center (clockwise left / counter-clockwise right); docking requires getting very close (30px) to the edge
  - **Animation & transitions**: 60fps sprite-sheet playback (at half speed); event switches cross a 150ms half-fade (down to 40% opacity and back) with no overlap or ghosting
  - **Floating-window settings dialog**: **Theme** (Angelina pet / built-in ball) + **Event · Asset · Audio** (each event can pick which sprite action and which sound to play — default: greeting →「呢？」, the rest silent; assets can be any loaded action, audio plays once per trigger while video can loop; when the matching trigger is enabled in "Trigger Conditions · Sounds", that detailed config wins); falls back to the round ball while frames load / on load failure
  - **Round ball** (switchable): drag it anywhere; **dragging it to a screen edge collapses it into a small half-ball (a ">" icon only)**; click to open the settings dialog
  - **Floating style** (Appearance): **desktop pet** by default, switchable back to the **round ball** (auto-fallback to the ball when no frames are bundled)
- **Settings dialog**: draggable (grab the title bar), z-index on top
  - 4 trigger conditions: **session end / options popup / permission request / stop**, each with an independent 【enable checkbox + sound dropdown】offering **built-in chime / no sound / a specific sound** ("built-in chime" is a Web Audio arpeggio — no audio file required)
  - **Attention events** (options popup / permission request) always ring — they play as soon as they appear, regardless of the conversation's running/viewing state, and take priority over the completion sounds
  - **Appearance**: Whale Girl (default) / Pure White / Pure Black, plus a **customizable voice name** (the theme applies to every dialog at once and switches instantly)
  - Volume slider (0–100%), **test sound** dropdown (incl. a "built-in chime" option) + ▶ preview + status bar, reset button position
  - Sound library (local audio in the plugin `sounds/` folder, managed via a `sounds.json` control file) + refresh + **Upload dialog: pick/drag-drop upload, delete sounds, restore hidden bundled sounds; non-bundled sounds can be renamed via ✎**
  - **"AI Voice" dialog**: above the sound library — bring your own Alibaba Cloud Bailian API Key and cloned voice ID, type a line and generate speech in your custom voice (custom file name / preview / delete, **one-click add to the library with automatic registration**); a step-by-step tutorial with screenshots is included (click an image to zoom to 3× and drag to pan); token costs are on you
  - 3 bundled sounds ("hirari do～" / "Huh?" / "AWAWA!") — cannot be deleted or renamed (delete = soft-hide, restorable anytime); hidden sounds are directly previewable with instant playback
  - The sound library scrolls vertically beyond 4 entries and never exceeds the settings panel height; file extensions are hidden from sound names
- **Sound source**: local audio files in the plugin `sounds/` directory (mp3/wav/ogg/m4a/flac/opus/aac/wma/webm), served by the host side via the `/dsh-sounds-control` static server (Range/206 chunking, ETag, streaming)
- **Persistent config**: dual-write to localStorage + host-side `config.json`, survives restarts; every field is sanitized (type/range/enum) on load, bad values fall back to defaults
- **Preload on startup**: fetches config and sound list and buffers the configured sound when the app opens, so the first play is instant
- Defaults: volume 60%; session end →「hirari do～」, options popup / permission request →「呢？」, stop → built-in chime
- Falls back to a Web Audio built-in beep when no sound is selected or loading fails
- **Dev tooling**: `npm test` (Node smoke tests for host-side list/config/upload/delete and browser-side logic), `npm run setup` / `setup:fix` / `setup:deploy` (multi-profile auto-config), `releases/build-single-exe.ps1` (builds the Setup/UnSetup installers)

## Directory structure

```
dsh-sound-lab/
├── package.json          # Package manifest (dsh.client / dsh.bundle.patch / types / scripts)
├── cordis.patch.yml      # Composition patch: mounts line ui-event-sounds
├── CHANGELOG.md          # Version history
├── README.md / README.zh.md
├── LICENSE
├── sounds/               # Sound library: bundled sounds (hirari do～/Huh?/AWAWA!) + uploaded/AI-generated audio
├── frames/               # Pet frame assets: <action>/sprite.webp sprite sheet (WebP lossless) + motion.json (60fps, 12 actions)
├── lib/
│   ├── index.js          # Host side: /dsh-sounds-control static service (list/config/audio/TTS) + /dsh-frames-control (pet frames)
│   ├── client.js         # Browser side: desktop pet / floating ball + settings dialog + trigger detection + playback
│   ├── tutorial/         # Illustrated tutorial images for AI voice generation (image1.png / image2.png)
│   └── types/index.d.ts  # Type declarations
└── tools/
    ├── install.mjs       # Multi-profile auto-config (setup / --fix / --unify / --deploy)
    ├── test-host.mjs     # Host-side API smoke tests (list/config/upload/delete/TTS)
    ├── test-client.mjs   # Browser-side logic smoke tests
    └── api/              # Standalone TTS script (tts_api.py + guide + reference audio)
```

## Dual-side structure

The plugin is two halves, loaded automatically from a single install:

- **Host side (Node half)** [lib/index.js](lib/index.js): runs in the DSH main process (Node), exposes the plugin `sounds/` directory to the browser side through the `/dsh-sounds-control` static server (sound list / audio files / config.json persistence), and the `frames/` pet assets through `/dsh-frames-control` (action list / frame PNGs)
- **Browser side (Web GUI half)** [lib/client.js](lib/client.js): runs in the DSH Web GUI page — desktop pet (animation / drag / dock) or floating ball, settings dialog, trigger detection, and sound playback

Mounting of both halves is driven by `package.json` — no separate install needed:

- `dsh.client` declaration (`exports "./client"`) → loads the browser side in the Web GUI
- `dsh.bundle.patch` ([cordis.patch.yml](cordis.patch.yml)) → registers the host side in the DSH main process

Because dsh plugins are isolated **per profile** (`$DSH_HOME/profiles/<name>` each has its own `package.json` / `node_modules`), a plugin must be registered in every profile you want it in — that's what the installer and `tools/install.mjs` automate (see [Install](#install)).

## Usage

1. **Add sounds**: during development, put audio files in the repo `sounds/` folder (see the directory tree above) — they are reconciled into the library automatically on startup. When installed, there is no need to hunt for the folder — open the settings dialog → Sound library → **Upload**, then pick a local file or drag & drop to import (it is copied into the `sounds/` folder of the install location automatically). You can also delete sounds from the list (bundled sounds are hidden, restorable anytime) or rename them via ✎.
2. **Open the settings dialog**: click the desktop pet (or the round ball)
3. **Refresh the sound list**: click "Refresh"; the plugin enumerates all audio files under `sounds/`
4. **Configure triggers**: for the four events (session end / options popup / permission request / stop), set 【enable + sound】independently — each dropdown offers "built-in chime / no sound / a specific sound" ("built-in chime" is a Web Audio arpeggio — no audio file required)
5. **Test sound**: pick one in the "Test sound" dropdown (which includes a "built-in chime" option) and click ▶ to preview; selecting "built-in chime" or nothing previews the Web Audio arpeggio. Adjust volume with the slider (0–100%)
6. **In effect**: the chosen sound plays automatically on matching events; a built-in beep plays as a fallback when nothing is selected or loading fails

> Tip: drag the desktop pet anywhere; it docks at screen edges (peek left/right, sleep top/bottom — left/right hidden 40% with a 30° rotation, top flipped upside-down hidden 80%, bottom not hidden), falls asleep after 90s idle, greets on click; switch between desktop pet / round ball and Whale Girl / Pure White / Pure Black under "Appearance"; the floating-window settings dialog lets you adjust Theme / Event · Asset · Audio independently; position and config are saved automatically and survive restarts.

## Disclaimer

- This is a **fan-made (unofficial) personal project** with no affiliation, sponsorship, or authorization from the official *Arknights* team or Shanghai Hypergryph Network Technology Co., Ltd.
- Character images, names, quotes, and voice assets referenced in this project (including Angelina's "hirari do～", "Huh?" and "AWAWA!" voice clips) belong to the official *Arknights* team and their respective right holders; the copyright of the voices belongs to the respective voice actors.
- This project is for personal learning, research, and entertainment only — **not for commercial use** and not for profit.
- The sound assets shipped with the project are local audio files added by users; users are responsible for ensuring their usage complies with applicable laws and the original right holders' requirements.
- If any right holder believes any content of this project infringes their rights, please contact the author to remove the material and we will handle it promptly.
- This project is provided as-is; the author is not responsible for any consequences arising from its use.
