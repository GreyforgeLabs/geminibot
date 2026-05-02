# STARTHERE.md - AI Bootstrap Guide

> This file is designed for coding assistants. If you are a human,
> see [README.md](README.md) for the human-friendly guide.

## Quick Bootstrap

```bash
git clone https://github.com/GreyforgeLabs/geminibot.git && cd geminibot && ./scripts/setup.sh
```

## What This Project Does

GeminiBot is a Telegram bridge for controlling a local `gemini-cli` session from one authorized Telegram account. It queues requests, streams progress updates, accepts bounded uploads, and keeps writes inside the configured workspace.

## Project Structure

```text
geminibot/
  bot.mjs          # Telegram polling bridge and gemini-cli runner
  .env.example    # local runtime configuration template
  package.json    # Node scripts and metadata
  scripts/        # setup and verification helpers
  README.md       # human-facing documentation
```

## Setup Prerequisites

- Node.js 20 or newer.
- npm.
- `gemini-cli` installed and available as `gemini` for runtime use.
- A Telegram bot token from BotFather.

## Installation Steps

1. Clone: `git clone https://github.com/GreyforgeLabs/geminibot.git`
2. Enter directory: `cd geminibot`
3. Run setup: `./scripts/setup.sh`
4. Copy `.env.example` to `.env` if setup did not already create it.
5. Fill in `TELEGRAM_TOKEN`, `AUTHORIZED_USER_ID`, `GEMINI_SESSION_ID`, and `WORKSPACE_DIR`.

## Verification

```bash
npm test
```

Expected output: `node --check bot.mjs` exits with status 0.

## Key Entry Points

- `bot.mjs` - Telegram polling loop, queue, upload handling, and child process runner.
- `.env.example` - required runtime environment variables.

## Configuration

Use `.env` locally and keep it out of git. Required variables:

- `TELEGRAM_TOKEN`
- `AUTHORIZED_USER_ID`
- `GEMINI_SESSION_ID`
- `WORKSPACE_DIR`

Optional hardening variables:

- `GEMINI_APPROVAL_MODE`
- `MAX_UPLOAD_BYTES`
- `BRIDGE_LOG_PATH`

## Common Tasks

```bash
npm test
npm start
```
