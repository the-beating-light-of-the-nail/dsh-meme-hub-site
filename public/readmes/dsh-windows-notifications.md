# DSH Windows Notifications

[简体中文](README.zh.md) | English

Windows desktop notifications, optional sounds, and DSH-styled in-page cards for DeepSeek Harness Web. Keep the DSH tab open and receive task results or requests for attention while working in another application.

![DSH notification settings with an in-page card and a Windows desktop notification](https://raw.githubusercontent.com/lsq-dsh-plugins/dsh-windows-notifications/9769f3fa1b4e4dd922ef449510eb3b258d9183ef/assets/notification-settings.png)

## Notification behavior

By default, one event produces either a Windows notification or an in-page card, not both. Sound is independent and can accompany either presentation.

| DSH state | Default presentation |
| --- | --- |
| Tab visible and browser window focused | DSH in-page card |
| DSH visible on another monitor while a different application is focused | Windows notification |
| Another browser tab is active or the browser is minimized | Windows notification |
| Windows notification unavailable or rejected | In-page card fallback, when enabled |

The decision uses browser visibility and focus rather than monitor count. If “Only show system notifications while DSH is inactive” is disabled, Windows notifications may also appear while DSH is focused; a successfully delivered Windows notification still suppresses the in-page card for that same event.

## Events

- Task completed normally.
- Task failed, was aborted, blocked, interrupted, or reached the output limit.
- DSH is waiting for approval, plan review, or an answer to a question.
- Optional completion and failure notifications from subagents.

Clicking a Windows notification focuses DSH and opens the related Session. The plugin reads the durable Harness `turn/end` result instead of inferring completion from a transient running-state change. Initial page load, refresh, and reconnect establish a silent baseline, so old events are not replayed as new notifications.

## Settings

Open **Settings → Notifications** inside DSH Web.

| Setting | Default | Purpose |
| --- | --- | --- |
| Enable notifications | On | Master switch for task notifications |
| Windows notifications | On | Use the browser Notification API |
| Only while DSH is inactive | On | Avoid a system alert while actively viewing DSH |
| In-page notifications | On | Show a DSH-styled card when no Windows alert is delivered |
| Notification sound | On | Play a synthesized Web Audio chime |
| Volume | 55% | Set the chime volume |
| Task completed | On | Notify successful task completion |
| Failures and interruptions | On | Notify non-successful turn endings |
| Waiting for your action | On | Notify approvals, plan reviews, and questions |
| Subagent notifications | Off | Include subagent completion and failure events |

Windows notifications, in-page cards, and sound each have a separate test action. Repeated Windows or in-page tests replace the unfinished test of the same kind instead of building a queue; real task notifications retain their arrival order.

## Installation

Install the public package into the DSH Web profile:

```sh
dsh plugin --profile web add @lsq64737/dsh-windows-notifications
```

Restart DSH Web if it is already running. Run the same add command to update an existing installation.

Remove the plugin with:

```sh
dsh plugin --profile web remove @lsq64737/dsh-windows-notifications
```

## First use

1. Open DSH Web and go to **Settings → Notifications**.
2. Select **Allow notifications**.
3. Accept the browser's notification permission prompt.
4. Run **Test Windows notification**, **Test in-page notification**, and **Test sound**.

Browsers require a user gesture before requesting permission, so the plugin never opens the permission prompt automatically during page load. If permission was denied previously, restore it from the site's permission settings in the browser before testing again.

## Browser and Windows requirements

- The DSH tab must remain open. Closing the tab or browser stops all notification processing.
- Windows notifications require a browser and page origin that expose the Notification API in a permitted secure context.
- Chrome or Edge site permissions and Windows Do Not Disturb settings remain authoritative; the plugin cannot bypass them.
- Windows controls the system notification frame, placement, and duration. The plugin supplies the DSH icon, title, message, and click action.
- A browser may throttle or freeze a long-unused background tab, delaying notifications even while the DSH connection appears active.

## Privacy and reliability

- The plugin does not use a third-party notification service. Event handling stays inside DSH Web, the browser Notification API, Web Audio, and Windows.
- Notification text can include the DSH Session title and is therefore visible to Windows and on the lock screen according to system notification settings.
- Sounds are synthesized with Web Audio; no audio file is downloaded.
- A desktop-delivery failure falls back to an in-page error or task card when in-page notifications are enabled.
- Operational messages use the `windows-notifications:` prefix in Harness logs or the browser console. They cover permission, delivery, settings, and audio failures without recording credentials.

## Development

Requirements: Node.js 24 or newer and a compatible DSH development workspace.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

## License

[MIT](LICENSE)
