# dsh-hiboard-push

Push task-completion messages to the Huawei HarmonyOS negative-one-screen
("Today" / 智慧助手·今天) as service cards, from a DeepSeek Harness (dsh)
agent. Wire-compatible with the OpenClaw [today-task](https://clawhub.com/skills/today-task)
skill: the same HIBoard upload endpoint, the same payload contract, and the
same card rendering rules — so the same authCode from 负一屏 works here too.

When a task finishes, the agent calls `hiboard_push` with the task name and
the Markdown result; the card appears on the phone's Today feed moments
later. No client UI, no extra runtime dependencies (HTTP uses the Node
built-in `fetch`).

## Install

```bash
dsh plugin --profile web add github:Entity-Him/dsh-hiboard-push
```

## Linking tutorial (负一屏)

Three steps to connect dsh to your phone negative-one-screen feed:

### 1. Get the authCode on your phone

1. Open 负一屏 (assistant-today) on the phone.
2. 我的 → 动态管理 → 关联账号 → **Claw 智能体** → get the authorization code.
3. You get a code (e.g. `uhIzvTvjwnAD`). **Do not share it.**

### 2. Install the plugin

```bash
dsh plugin --profile web add github:Entity-Him/dsh-hiboard-push
```

### 3. Configure the authCode from a terminal (recommended)

The code is stored in `~/.dsh/hiboard-auth.env` (mode 600, hidden from the
settings panel); the dsh supervisor sources it on every launch:

```bash
dsh-hiboard-auth your-auth-code     # write the authCode
dsh-hiboard-auth                    # check whether configured (value hidden)
dsh-hiboard-auth -d                 # clear it
```

Restart dsh to apply. Alternatives: the `hiboard-push` settings section
(password-style input, field marked `role(secret)` so it is redacted on the
wire) or the environment variable:

```bash
export DSH_HIBOARD_AUTH_CODE=your-auth-code
```

### Verify

In the dsh chat ask the agent to:

- Dry-run first: `call hiboard_push with dry_run` (validates, does not send).
- Then a real connection test: `call hiboard_verify` — the phone receives a
  "dsh 连接测试" card.

Once the card arrives, the link is live; the agent will call `hiboard_push`
automatically when tasks finish.

### Troubleshooting

- `0000900034` invalid authCode: re-fetch from 负一屏 → 我的 → 动态管理 →
  关联账号 → Claw 智能体, then `dsh-hiboard-auth new-code` and restart dsh.
- The authCode is a personal credential: whoever holds it can push cards to
  your feed — never paste it into group chats or commit it to a repo.
## Usage

The plugin registers two tools:

### `hiboard_push`

| Parameter     | Required | Description                                                       |
|---------------|----------|-------------------------------------------------------------------|
| `name`        | ✅       | Task name; card title, `scheduleTaskName`, and `summary`.        |
| `content`     | ✅       | Markdown body (≤ 5000 chars), rendered verbatim on the card.     |
| `result`      | ❌       | Result summary / status label. Default: `任务已完成`.            |
| `schedule_id` | ❌       | Periodic-task ID; keep the same ID to group repeated cards.      |
| `dry_run`     | ❌       | Build and validate the payload without sending (no authCode needed). |

The card style follows which fields are filled (same as today-task):

- **Standard task card** — `name` + `content` + `result`.
- **Periodic task card** — the same, with a `schedule_id`.
- **Summary-only card** — `name` + `result` without `content`.

### `hiboard_verify`

Sends a minimal real connection-test card to the phone, to confirm the
authCode and network path end to end.

## API contract (for reference)

- Endpoint: `POST https://hiboard-claw-drcn.ai.dbankcloud.cn/distribution/message/cloud/claw/msg/upload`
- Headers: `Content-Type: application/json; charset=utf-8`,
  `x-trace-id: task-push-<yyyyMMddHHmmss>`
- Body:

```json
{
  "data": {
    "authCode": "<authCode>",
    "msgContent": [
      {
        "msgId": "dsh_<epoch-sec>_<rand>",
        "scheduleTaskId": "",
        "scheduleTaskName": "任务名称",
        "summary": "任务名称",
        "result": "任务已完成",
        "content": "# Markdown",
        "source": "OpenClaw",
        "taskFinishTime": 1710000000
      }
    ]
  }
}
```

- Success: HTTP 200 with `"code": "0000000000"`.
- `"code": "0000900034"` means the authCode is invalid.

## Development

```bash
node --test test/core.test.mjs
```

## License

MIT
