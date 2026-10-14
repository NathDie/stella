# Stella

Discord bot for the **Punk Records** server. Stella is a client of the Punk Records API: it contains no business logic. It queries the API, displays the results on Discord and sends automatic reports.

It also listens to its owner's voice in a dedicated voice channel, with fully local transcription.

## Features

| Area | Description |
|---|---|
| **Monitoring** | List of monitored sites, on-demand availability check, automatic reports and alerts with a mention |
| **Tasks** | Task list, complete a task through a dropdown menu or a command with autocomplete, daily report |
| **Reminders** | Today's reminders, automatic reports (today and tomorrow) |
| **Voice** | The bot joins the voice channel when the owner enters it, captures their voice and transcribes it locally |

### Slash commands

| Command | Purpose |
|---|---|
| `/ping` | Bot latency |
| `/monitoring-list` | List of registered monitorings |
| `/monitoring-ping` | Checks every site and shows 🟢 / 🔴, the HTTP status code and the response time |
| `/task-list` | Task list (sorted by due date) with a menu to complete a task |
| `/reminder-list` | Today's reminders, then processes overdue reminders |

Commands are synced to the servers the bot is in on every startup (`clientReady`). There is no separate deploy script.

### Scheduled jobs

Timezone: `Europe/Paris`.

| Job | Schedule | Behavior |
|---|---|---|
| Full monitoring report | 10:00, 14:00, 18:00 | Always sends the result, with a mention if a site is down |
| Silent monitoring check | Every other hour | Only sends a message (with a mention) if a site is down or the API returns an error |
| Task report | 09:00 | Open tasks, mention if any are overdue, menu to complete them |
| Today's reminders | 09:00 | Today's reminders, then processes overdue reminders |
| Tomorrow's reminders | 18:00 | Tomorrow's reminders |

No message is sent when there is nothing to report (empty list).

### Voice

1. You join the channel defined by `VOICE_CHANNEL_ID`: Stella joins you.
2. Only the user `OWNER_USER_ID` is listened to; everyone else is ignored.
3. A sentence ends after a period of silence (`SILENCE_MS` in `src/voice/recorder.ts`, 2.5 s recommended).
4. The audio is converted (48 kHz stereo to 16 kHz mono) and transcribed locally with whisper.cpp. The temporary file is deleted immediately.
5. You leave the channel: Stella leaves too.

Progress:

- [x] Join and leave the channel (owner only)
- [x] Voice capture (`recordings/` for testing)
- [ ] Local transcription (whisper.cpp)
- [ ] Intent parsing (text to action: reminder title and date), using a local model
- [ ] Reminder creation through the API
- [ ] Voice replies ("reminder saved", "error while saving")

Audio reception is not officially documented by Discord: its stability is not guaranteed, and it may break after a Discord update.

## Stack

- Node.js 22.12 or newer
- TypeScript (ESM), run with `tsx` in development
- [discord.js](https://discord.js.org) v14 (v15 is still a pre-release)
- `@discordjs/voice`, `prism-media`, `opusscript` (pure JavaScript Opus decoding)
- `node-cron` for scheduled jobs
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) for local transcription

## Installation

```bash
git clone <repository-url> stella
cd stella
npm install
```

### Local transcription (whisper.cpp)

```bash
brew install whisper-cpp
mkdir -p models
curl -L -o models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
which whisper-cli
```

`ggml-base.bin` (same URL) is a lighter alternative if the `small` model is too slow.

### Configuration

Create a `.env` file at the project root:

```env
# Discord
DISCORD_TOKEN=

# Punk Records API
API_URL=https://api.punk-records.local
API_TOKEN=

# Channels and users
MONITORING_CHANNEL_ID=
MONITORING_ALERT_USER_ID=
TASK_CHANNEL_ID=
REMINDER_CHANNEL_ID=
VOICE_CHANNEL_ID=
OWNER_USER_ID=

# Local transcription
WHISPER_BIN=/opt/homebrew/bin/whisper-cli
WHISPER_MODEL=./models/ggml-small.bin
```

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token (Developer Portal, Bot tab) |
| `API_URL` | Base URL of the API |
| `API_TOKEN` | Bearer token sent with `PATCH` requests |
| `MONITORING_CHANNEL_ID` | Channel for monitoring reports |
| `MONITORING_ALERT_USER_ID` | User mentioned on alerts (monitoring, overdue tasks, reminders) |
| `TASK_CHANNEL_ID` | Channel for the task report |
| `REMINDER_CHANNEL_ID` | Channel for reminder reports |
| `VOICE_CHANNEL_ID` | Voice channel that triggers the bot |
| `OWNER_USER_ID` | Only user allowed to use voice |
| `WHISPER_BIN` | Path to `whisper-cli` |
| `WHISPER_MODEL` | Path to the Whisper model |

IDs can be copied with Discord's developer mode (right-click, *Copy ID*). A missing variable makes startup fail with an explicit message.

### Discord setup

In the [Developer Portal](https://discord.com/developers/applications):

- Invite scopes: `bot` and `applications.commands`.
- Intents used: `Guilds` and `GuildVoiceStates`. No privileged intent is required.
- Permissions: view channels, send messages, embed links, connect and speak (voice channel).

## Running the bot

```bash
npm run dev     # development (auto-reload)
npm run build   # compile to dist/
npm start       # production
```

The `dev` script sets `NODE_TLS_REJECT_UNAUTHORIZED=0` to accept the local API's self-signed certificate. This disables TLS verification for the whole process: it must not be used in production (the `start` script does not include it).

## Structure

```
src/
├─ index.ts                 # Discord client, loading of commands and events
├─ config.ts                # reading and validating environment variables
├─ loader.ts                # recursive module loading (commands, events)
├─ types.ts                 # Command, BotEvent, StellaClient
├─ commands/                # one command per file, grouped by area
│  ├─ ping.ts
│  ├─ monitoring/
│  ├─ tasks/
│  └─ reminders/
├─ events/
│  ├─ clientReady.ts        # command sync, jobs startup
│  ├─ interactionCreate.ts  # commands, autocomplete, task menu
│  └─ voiceStateUpdate.ts   # the bot follows the owner into the voice channel
├─ jobs/                    # scheduled jobs (node-cron)
├─ models/                  # types of the data returned by the API
├─ services/                # API calls (api.ts: GET with retries, PATCH with Bearer)
├─ utils/                   # embed and menu building
└─ voice/                   # capture, transcription, sentence handling
```

Principles:

- **No business logic in the bot**: everything goes through the API.
- **One command or event = one file**, with an `export default`. The loader discovers them automatically, including in subfolders.
- **Commands only handle display**: API calls live in `services/`, shared rendering (embeds, menus) lives in `utils/`, so that commands and jobs can reuse it.

## Adding a command

Create a file in `src/commands/` (or a subfolder):

```ts
import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types.js';

const command: Command = {
    data: new SlashCommandBuilder().setName('example').setDescription('Description'),
    async execute(interaction) {
        await interaction.reply('Hello');
    },
};

export default command;
```

Restart the bot: the command is registered on startup. If it does not show up, fully quit Discord (`Cmd + Q`) and reopen it. For a command that calls the API, start with `await interaction.deferReply()` (Discord only allows 3 seconds to respond).

## Expected API

| Endpoint | Purpose |
|---|---|
| `GET /monitorings` | List of `{ id, name, link }` |
| `GET /tasks` | List of tasks |
| `PATCH /tasks/{id}` | Completes a task (`status: "done"`, `complete_at` in ISO 8601), with `Authorization: Bearer` |
| Reminders | See `src/services/reminder.service.ts` |

API errors are thrown as `ApiError` (with `status` and `body`), and `GET` requests are retried twice on network errors or 5xx responses.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `unable to verify the first certificate` | Self-signed API certificate: use `npm run dev`, or `NODE_EXTRA_CA_CERTS` |
| `500` with `SQLSTATE[HY000] [2002] Connection refused` | The API cannot reach its database: check MySQL on the API side |
| Old commands still showing in Discord | Client cache: fully quit Discord and reopen it |
| The bot does not join the voice channel | Check `VOICE_CHANNEL_ID`, `OWNER_USER_ID` and the channel permissions. Leave and re-enter if you were already in the channel at startup |
| Nothing is captured in voice | The bot must have `selfDeaf: false`, and your mic must not be muted |
| `Cannot find module 'opusscript'` or Opus decoder not found | Install `opusscript` (the native `@discordjs/opus` module does not always ship a binary for your Node version) |
| Whisper not found or option rejected | Check `WHISPER_BIN` with `which whisper-cli`, and the options with `whisper-cli --help` |

## Security

- The `.env` file and the `recordings/` folder (which contains recordings of your voice) are ignored by git, as is `models/`.
- Voice only reacts to `OWNER_USER_ID`, and only in the `VOICE_CHANNEL_ID` channel.
- Mentions are restricted to the alert user (`allowedMentions`), so that a site or task name cannot trigger an `@everyone`.
- Transcription is local: audio never leaves the machine.
- If the Discord token has been exposed (for example committed by mistake), regenerate it in the Developer Portal (*Reset Token*).