# Gemini Telegram Bridge (v5)

A high-performance Node.js bridge to remote control `gemini-cli` via Telegram. 

## New in v5
- **Real-time Streaming:** Watch Solon "type" his response live on your phone.
- **Request Queue:** Handles multiple messages gracefully without session locking.
- **File Uploads:** Send any document to the bot and it will be saved directly to your workspace.
- **Debounced Edits:** Optimized for Telegram's rate limits to prevent "429 Too Many Requests" errors.
- **Admin Commands:** `/logs` to see backend activity and `/status` to check bot health.

## Features
- Remote access to your local Gemini sessions.
- Secure access restricted to a specific Telegram User ID.
- Supports `gemini-cli` tool execution via YOLO mode.
- Persistent sessions and context awareness.

## Setup

1. **Install Node.js 20+**
2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your details:
   - `TELEGRAM_TOKEN`: Get from @BotFather.
   - `AUTHORIZED_USER_ID`: Your numeric Telegram ID (use @userinfobot).
   - `GEMINI_SESSION_ID`: The UUID of the session you want to resume.
   - `WORKSPACE_DIR`: Absolute path to your Gemini project directory.
   - `BRIDGE_LOG_PATH`: (Optional) Path to where you want logs stored.

3. **Run:**
   ```bash
   node bot.mjs
   ```

## Running in Background
Use `tmux` for a persistent session:
```bash
tmux new-session -d -s geminibot "node bot.mjs"
```
To view the live bridge log:
```bash
tmux attach -t geminibot
```
