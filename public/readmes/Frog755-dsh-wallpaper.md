# dsh-wallpaper

[English](README.md) | [简体中文](README.zh-CN.md)

Persistent custom wallpaper for the DeepSeek Harness Web profile.

`dsh-wallpaper` adds one settings row under **Settings -> General**:

- choose a local image or MP4 video;
- tune surface opacity and wallpaper blur;
- remove the wallpaper at any time.

Images are resized in the browser. MP4 videos up to 300 MB are uploaded only to
the local DSH Host. When `ffmpeg` and `ffprobe` are available, they are compressed
into high-quality H.264 wallpapers with a single fast encoding pass, a target
near 18 MB, 1080p maximum resolution, and 30 fps maximum. Audio is removed
because a background video is muted. Without those optional tools, the original
MP4 is retained so video wallpapers remain usable, although they may take more
disk space. Uploads stream directly to a temporary local file rather than being
buffered in the DSH Host process. The result is stored under `~/.dsh/wallpapers`, while `localStorage`
keeps only its local URL. Replacing or removing a video deletes its prior local
file, and startup removes old unreferenced wallpaper videos. Video wallpapers are muted, looped, and
auto-played; media is restored on the next launch. Its bundle patch also fixes
the Web server to port `9191`: browser storage is scoped to protocol + host +
port, so a random port would make saved wallpaper appear to disappear after
every restart.

## Requirements

Image wallpapers need no extra software. Video wallpapers also work without
extra software by retaining the original MP4. Install `ffmpeg` and `ffprobe` on
`PATH` for the DSH Host process to enable local compression.

## Screenshots

Wallpaper applied to the Web profile (image background with adjusted surface opacity):

![Wallpaper effect](https://raw.githubusercontent.com/Frog755/dsh-wallpaper/1044d3b74ddc2b324dfad048a469bee404f06c83/assets/wallpaper-effect.png)

The wallpaper settings card under **Settings -> General**:

![Wallpaper settings](https://raw.githubusercontent.com/Frog755/dsh-wallpaper/1044d3b74ddc2b324dfad048a469bee404f06c83/assets/wallpaper-settings.png)

## Compatibility

- Target: the DeepSeek Harness **Web profile** (`dsh web` or the desktop build's
  Web UI). The settings card is rendered by the DSH client runtime and needs a
  modern browser with `localStorage` support.
- The bundle patch pins the Web server to `http://127.0.0.1:9191`; see
  [Fixed origin](#fixed-origin) below for why, and what to do when the port is
  occupied.
- Image wallpapers require no external tools. Video wallpapers accept MP4 files
  up to 300 MB; without `ffmpeg`/`ffprobe` on `PATH` the original file is kept
  as-is, otherwise it is compressed locally to H.264 (target ~18 MB, max 1080p,
  max 30 fps, audio removed).
- Peer dependencies: `react ^18.2.0`, `@deepseek-ai/cordis ^4.0.1`, and the DSH
  client packages listed in `package.json`. They are provided by the DSH host
  installation; do not install them manually.

## Install

Install the public npm package in one command:

```powershell
dsh plugin --profile web add -w @frog755/dsh-wallpaper
```

Restart `dsh web` after initial installation so the host loader reads the new
bundle patch. Open **Settings -> General -> Wallpaper** to choose your image.

For local development from a cloned repository, run this from the repository
root instead:

```powershell
dsh plugin --profile web add -w .
```

Changing `lib/client.js` later is picked up by the DSH client HMR chain;
hard-refresh the page if the browser has an older module active.

## Fixed origin

The package patch pins DSH Web to `http://127.0.0.1:9191`. This is intentional:
`localStorage` isolates values by origin, including the port.

If `9191` is occupied, either stop the process holding it or change the port in
`cordis.patch.yml` before starting DSH. Changing the port creates a different
browser storage namespace, so the wallpaper must be selected once on that new
origin.

## What is persisted

All settings remain local to the current browser profile:

- `dsh-wallpaper:image`
- `dsh-wallpaper:opacity`
- `dsh-wallpaper:blur`

On its first run, the plugin imports an existing `dsh-skin` wallpaper and its
opacity/blur values when no `dsh-wallpaper` value exists. This lets a profile
migrate without selecting the background again.

No image is sent to a server. Images are stored as compressed data URLs and are
reduced to keep the browser storage footprint bounded.

## Development

The client bundle uses DSH's `window.__ModuleLoader__.load` format, so no build
step is needed. It is served by `dsh-client-modules`; `dsh-client-hmr` watches
its content and sends a rebuilt notification to the browser when it changes.

## Attribution

This independent wallpaper-focused plugin was derived from, and substantially
reworked from, the wallpaper component of
[KinGao294/dsh-skin](https://github.com/KinGao294/dsh-skin), which is licensed
under MIT. The original copyright notice is retained in [LICENSE](LICENSE).
