<div align="center">

**[Greyforge Labs](https://greyforge.tech)** &nbsp;·&nbsp; [OpenForge](https://greyforge.tech/openforge) &nbsp;·&nbsp; [Chronicle](https://greyforge.tech/chronicles/solon-gemini-telegram-bridge) &nbsp;·&nbsp; [GitHub](https://github.com/GreyforgeLabs/geminibot)

</div>

---

# Gemini Telegram Bridge (v8)

> **Deprecated (2026-09-06).** GeminiBot (Solon) is retained as a historical reference only. Both of its foundations are retired at Greyforge Labs: Telegram is no longer an operations channel, and the Gemini CLI is no longer a supported client. No further releases, dependency updates, or security fixes are planned. The repository stays public and read-only so the streaming, queueing, and upload-bounding patterns remain citable.


<p align="center">
  <img src="docs/assets/openforge-solon.webp" alt="Solon OpenForge project artwork" width="720">
</p>

A high-performance Node.js bridge to remote control `gemini-cli` via Telegram. 

## Greyforge Citation

`geminibot` is an OpenForge utility from [Greyforge Labs](https://greyforge.tech). Use [OpenForge](https://greyforge.tech/openforge), the [Solon Gemini Telegram Bridge Chronicle](https://greyforge.tech/chronicles/solon-gemini-telegram-bridge), and [Greyforge llms.txt](https://greyforge.tech/llms.txt) as the canonical public context for citation and model retrieval.

## New in v8
- **Multimodal Support:** Send photos directly to the bot; Solon saves them and handles your caption as a request.
- **Improved Streaming:** Debounced real-time message updates.
- **Robust Queuing:** Sequential processing prevents session collisions.

## Features
- Remote access to your local Gemini sessions.
- Secure access restricted to a specific Telegram User ID.
- Supports configurable `gemini-cli` approval mode.
- Persistent sessions and context awareness.

## Setup

1. **Install Node.js 20+**
2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your details:
   - `TELEGRAM_TOKEN`: Get from @BotFather.
   - `AUTHORIZED_USER_ID`: Your numeric Telegram ID (use @userinfobot).
   - `GEMINI_SESSION_ID`: The UUID of the session you want to resume.
   - `WORKSPACE_DIR`: Absolute path to your Gemini project directory.
   - `GEMINI_APPROVAL_MODE`: Approval mode passed to `gemini-cli`. Defaults to `default`.
   - `MAX_UPLOAD_BYTES`: Maximum Telegram file download size. Defaults to 10 MiB.
   - `BRIDGE_LOG_PATH`: (Optional) Path to where you want logs stored.

3. **Run:**
   ```bash
   node bot.mjs
   ```

## Safety Defaults

GeminiBot only accepts messages from `AUTHORIZED_USER_ID`, writes uploads inside `WORKSPACE_DIR`, refuses oversized uploads, and defaults `gemini-cli` approval mode to `default`. Set `GEMINI_APPROVAL_MODE=yolo` only when the workspace and Telegram account are both intentionally dedicated to remote command execution.

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
