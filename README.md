<div align="center">

**[Greyforge Labs](https://greyforge.tech)** &nbsp;·&nbsp; [OpenForge](https://greyforge.tech/openforge) &nbsp;·&nbsp; [Chronicle](https://greyforge.tech/chronicles/solon-gemini-telegram-bridge) &nbsp;·&nbsp; [GitHub](https://github.com/GreyforgeLabs/geminibot)

</div>

---

# Gemini Telegram Bridge (v8)

<p align="center">
  <img src="banner.jpg" alt="Solon Banner" width="600">
</p>

A high-performance Node.js bridge to remote control `gemini-cli` via Telegram. 

## New in v7
- **Multimodal Support:** Send photos directly to the bot; Solon saves them and handles your caption as a request.
- **Improved Streaming:** Debounced real-time message updates.
- **Robust Queuing:** Sequential processing prevents session collisions.

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

---

<div align="center">

Built by **[Greyforge Labs](https://greyforge.tech)** &nbsp;·&nbsp; [OpenForge](https://greyforge.tech/openforge) &nbsp;·&nbsp; [Chronicle](https://greyforge.tech/chronicles/solon-gemini-telegram-bridge)

</div>
