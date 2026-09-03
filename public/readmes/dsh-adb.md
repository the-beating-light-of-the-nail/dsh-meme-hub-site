# dsh-adb

> ADB device & bench operations for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)

Give DSH agents direct control over Android devices and automotive bench rigs: device discovery, structured logcat, APK install, file pull/push, and performance snapshots. Built for on-vehicle and bench debugging workflows — generic within the domain (no Unity, no vendor protocol lock-in).

**English** | [简体中文](README.zh-CN.md)

## Install

```sh
dsh plugin --profile web add dsh-adb
```

Or install directly from GitHub: `dsh plugin --profile web add github:SamXiaBing/dsh-adb`

## Web device panel (v1.1.0)

A **Devices** tab (UI label 设备) in the conversation view ring (next to chat / trajectory / automation): device list with status, package autocomplete (fuzzy search), live streaming logcat window (level/keyword/package/pid filters, pause/clear/auto-scroll), device info card, process list, performance snapshot, and a **one-click health report** (UI label 设备体检 / Device Checkup: device identity, top-RSS processes, crash buffer, W/E/F logcat window, storage — persisted under `reportDir`, sendable to the conversation for diagnosis). The report turns raw evidence into signal before it reaches the model: crash-buffer entries are classified into **real crashes (with stack chains) vs. MediaTek boot markers**, repetitive logcat is **aggregated by tag** ("AOSP-MdnsDiscoveryManag ×3264" instead of 3k identical lines), and a compact **health summary** (verdict + issues) is attached — so the agent reasons from conclusions, not 17k raw lines. Plus harness synergy: **send any logcat/snapshot/report to the conversation** (the agent analyzes it), a live strip of the agent's adb operations, and a registered **crash-analysis skill** (`dsh-adb-crash-analysis`) for automation pipelines. Data flows over the package RPC channel; install into a web profile and restart the GUI (see `scripts/restart-web.ps1` for a one-click restart).

## Ecosystem

- ✅ [npm](https://www.npmjs.com/package/dsh-adb) — `dsh-adb` published (latest: 1.6.0)
- ✅ [awesome-deepseek-harness#87](https://github.com/0xsline/awesome-deepseek-harness/pull/87) — **merged**
- ✅ [awesome-dsh-plugin#85](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/85) — **merged**
- ✅ [awesome-DSH-plugin#29](https://github.com/Alex-Yanggg/awesome-DSH-plugin/pull/29) — **merged**

Topics: `dsh-plugin` `dsh` `adb` `android` `automotive` `bench`

## Tools

| Tool | Description |
| --- | --- |
| `adb_devices` | List devices (serial/state/product/model); run first to discover serials |
| `adb_connect` / `adb_disconnect` | Wireless bench connection (host:port, default 5555) |
| `adb_logcat` | Filtered read (tag/level/keyword/time-window/tail); `run_in_background` streams continuously as a job — read deltas with `job_output`, stop with `job_kill` |
| `adb_install` | Install APKs (`-r`/`-d`/`-g` options); validates the local file exists |
| `adb_file` | pull / push / ls / rm, per-device isolation |
| `adb_perf_snapshot` | Structured `dumpsys meminfo / gfxinfo / battery` snapshots (PSS, frame percentiles, jank rate, battery) |
| `adb_perf_baseline` | Perf regression: save a snapshot as a baseline (label/tags), compare current state and get a numeric diff (PSS, janky %, percentiles), list/delete baselines (stored locally under `baselineDir`) |
| `adb_crash_report` | One-call crash scene: parsed logcat crash buffer + dropbox excerpt + process state + memory summary |
| `adb_device_report` | One-click health report: device identity + top-RSS processes + crash buffer (real crashes w/ stacks vs. boot markers) + W/E/F logcat aggregated by tag + storage + health verdict; each section degrades independently; persisted under `reportDir` |
| `adb_wait_for` | Wait until a device condition holds — device-online / boot-complete / process appeared / logcat keyword — polling up to a budget, instead of sleeping a fixed number of seconds; returns `matched:false` on timeout |
| `adb_operation_ledger` | Append-only device operation ledger (record/list/rollback): record installs/pushes/etc., list history, or roll an app back to its last known-good APK (`adb install -r`); persisted as `operations.json` — the trust base for agent-driven device modification |
| `adb_screenshot` | Capture the device screen into a local PNG (screencap → pull), returning the saved path, byte size, and pixel dimensions — durable evidence for crash scenes / UI states / test frames |
| `adb_watch_crash` | Watch the crash buffer for NEW real crashes (foreground poll or background job; boot markers ignored; `matched:false` on timeout) — the first link of the monitor→capture→attribute chain |
| `adb_patrol_check` | One-click patrol: crash scan (real vs. boot markers) + perf vs. the latest stored baseline (regressions beyond a threshold) + battery/temperature/storage → compact verdict (`ok`/`attention`) with concrete issues; report persisted under `<reportDir>/patrol`. `compareToLast:true` attaches a delta vs. the previous stored patrol (new/gone crashes, worsening regressions, verdict transition). Fail-closed: a section that cannot be collected is itself an issue. No baseline → comparison skipped with a note; omit `package` → the perf section is skipped. Schedule it unattended with dsh-automation — see [docs/SCHEDULED-PATROL.md](docs/SCHEDULED-PATROL.md) |

Errors are structured `AdbError` with stable codes: `ADB_NOT_FOUND`, `ADB_UNAVAILABLE`, `DEVICE_NOT_FOUND`, `NO_DEVICES`, `CONNECT_FAILED`, `INSTALL_FAILED`, `ADB_EXIT_<code>`, etc.

## Usage: adb_watch_crash (Crash Watchdog)

Watch the device's crash buffer for **new** real crashes. On start, it reads the current buffer and remembers every existing crash signature (seed), so only crashes that appear *after* the watch begins are reported. Boot markers (`mtk-brm-*`) are not crashes and are ignored.

**Foreground mode** (default) — blocks until a new crash appears or the budget expires:

```json
// Agent calls:
{ "name": "adb_watch_crash", "args": { "timeoutMs": 60000 } }

// New crash detected:
{ "matched": true, "waitedMs": 3200, "crashes": [{ "time": "08-26 06:22:56.714", "pid": "2947", "tag": "AndroidRuntime", "message": "FATAL EXCEPTION: WM.task-1", "stack": ["AndroidRuntime: Process: com.miui.weather2, PID: 2947", "..."] }] }

// No new crash within budget (not an error):
{ "matched": false, "waitedMs": 60000, "crashes": [], "reason": "no new crash within 60000ms" }
```

**Background mode** (`run_in_background`) — returns a job id immediately, keeps polling:

```json
// Start watching in the background:
{ "name": "adb_watch_crash", "args": { "run_in_background": true, "timeoutMs": 300000 } }
// → { "kind": "background", "jobId": "adb-watch-crash-1" }

// Read latest detections with job_output:
// [adb_watch_crash] detected 1 new crash(es) after 5400ms
// - 08-26 06:22:56.714 pid=2947 AndroidRuntime: FATAL EXCEPTION: WM.task-1
//     AndroidRuntime: Process: com.miui.weather2, PID: 2947
//     ...
```

**Chain with crash capture** — when a crash is detected, pair with `adb_crash_report` and `adb_screenshot` to capture the scene:

```
1. adb_watch_crash (watch for new crash)
2. → crash detected → adb_crash_report (full crash scene: buffer + dropbox + process + memory)
3.                    → adb_screenshot (screen state at crash time)
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `serial` | string | defaultSerial | Target device serial |
| `timeoutMs` | integer | 60000 | Watch budget (max 600000 = 10 min) |
| `intervalMs` | integer | 1000 | Poll interval (min 250) |
| `withStacks` | boolean | true | Include same-pid stack lines per crash |
| `run_in_background` | boolean | false | Run as a background job; read via `job_output` |

## Configuration

Set the `config` block in `cordis.patch.yml` (or a profile patch):

```yaml
- id: dsh-adb
  name: dsh-adb
  config:
    adbPath: C:\Users\me\AppData\Local\Android\Sdk\platform-tools\adb.exe
    defaultSerial: emulator-5554
    timeoutMs: 30000
```

| Key | Description | Default |
| --- | --- | --- |
| `adbPath` | Absolute path to the adb executable | Auto-detect PATH / ANDROID_HOME / ANDROID_SDK_ROOT/platform-tools |
| `defaultSerial` | Default target device serial | none |
| `timeoutMs` | Per-command timeout | 30000 |
| `baselineDir` | Directory for `adb_perf_baseline` storage | `~/.dsh/storages/dsh-adb` |
| `reportDir` | Directory for `adb_device_report` storage | `<baselineDir>/reports` |
| `screenshotDir` | Directory for `adb_screenshot` storage | `<baselineDir>/screenshots` |

## Development

```sh
npm install            # add --include=dev when NODE_ENV=production
npm run build          # tsc → lib/
npm test               # parser/classification unit tests (node --test)
npm pack --dry-run     # verify publish contents (lib/ + cordis.patch.yml)
```

## Testing & Verification

- Principle: **ship only what is tested** — every committed feature has unit and/or end-to-end coverage.
- Verified on: Android 13 automotive bench + Android 14 phone (Redmi K50 Pro) + emulator.
- Per-version changes and verification: [CHANGELOG.md](CHANGELOG.md); test methodology and coverage: [docs/TESTING.md](docs/TESTING.md) (Chinese).

## Project Docs (bilingual; for AI agents & contributors)

- [docs/AGENTS.md](docs/AGENTS.md) / [docs/AGENTS.zh-CN.md](docs/AGENTS.zh-CN.md) — read first: purpose, rules, commands, environment facts, doc map
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) / [docs/REQUIREMENTS.zh-CN.md](docs/REQUIREMENTS.zh-CN.md) — purpose / scope / non-goals / acceptance criteria
- [docs/TESTING.md](docs/TESTING.md) / [docs/TESTING.zh-CN.md](docs/TESTING.zh-CN.md) — testing philosophy, three test layers, E2E steps, regression checklist
- [docs/ROADMAP.md](docs/ROADMAP.md) / [docs/ROADMAP.zh-CN.md](docs/ROADMAP.zh-CN.md) — harness×adb synergy feature roadmap (diagnosis report, crash attribution, screenshot vision, bench automation tests, wait primitives, approvals, multi-device compare, scheduled monitoring, rollback ledger)
- [docs/SCHEDULED-PATROL.md](docs/SCHEDULED-PATROL.md) / [docs/SCHEDULED-PATROL.zh-CN.md](docs/SCHEDULED-PATROL.zh-CN.md) — run the patrol unattended on a schedule (dsh-automation prompt template + gotchas)
- [PLAN.md](PLAN.md) / [PLAN.zh-CN.md](PLAN.zh-CN.md) — milestones & backlog

## License

MIT
