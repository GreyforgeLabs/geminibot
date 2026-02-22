import { spawn, execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// --- CONFIGURATION (Environment Variables) ---
const TOKEN = process.env.TELEGRAM_TOKEN;
const AUTH_ID = parseInt(process.env.AUTHORIZED_USER_ID, 10);
const SESSION_ID = process.env.GEMINI_SESSION_ID;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || process.cwd();
const BRIDGE_LOG = process.env.BRIDGE_LOG_PATH || './bot.log';

if (!TOKEN || !AUTH_ID || !SESSION_ID) {
  console.error("Error: Missing environment variables TELEGRAM_TOKEN, AUTHORIZED_USER_ID, or GEMINI_SESSION_ID.");
  process.exit(1);
}

const URL = `https://api.telegram.org/bot${TOKEN}`;
const FILE_URL = `https://api.telegram.org/file/bot${TOKEN}`;

// --- QUEUE SYSTEM ---
let queue = [];
let processing = false;

async function api(method, params = {}) {
  try {
    const r = await fetch(`${URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await r.json();
  } catch (e) { console.error(`API Error (${method}):`, e); }
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const { chat_id, text } = queue.shift();

  try {
    console.log(`[${new Date().toLocaleTimeString()}] Executing: ${text}`);
    await api('sendChatAction', { chat_id, action: 'typing' });
    let status = await api('sendMessage', { chat_id, text: '⏳ Solon is thinking...' });
    let status_id = status?.result?.message_id;

    const child = spawn('gemini', [
      '--prompt', text,
      '--resume', SESSION_ID,
      '--approval-mode', 'yolo',
      '--output-format', 'stream-json'
    ], { 
      cwd: WORKSPACE_DIR, 
      env: { ...process.env, TERM: 'xterm-256color' },
      timeout: 300000 // 5 minute hard timeout
    });

    let fullResponse = '';
    let lastEditTime = 0;
    let streamActive = false;

    child.stdout.on('data', async (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          const now = Date.now();

          if (event.type === 'message' && event.role === 'assistant') {
            fullResponse += event.content || '';
            streamActive = true;
            // Debounce text updates (max 1 per ~1.2s to stay safe)
            if (status_id && now - lastEditTime > 1200 && fullResponse.length > 0) {
              lastEditTime = now;
              await api('editMessageText', { 
                chat_id, 
                message_id: status_id, 
                text: fullResponse + ' █' 
              });
            }
          } else if (event.type === 'tool_use' && !streamActive) {
            const tname = event.tool_name || 'tool';
            if (status_id && now - lastEditTime > 1000) {
              lastEditTime = now;
              await api('editMessageText', { 
                chat_id, 
                message_id: status_id, 
                text: `🛠 Executing: \`${tname}\``,
                parse_mode: 'Markdown'
              });
            }
          }
        } catch(e) {}
      }
    });

    child.on('close', async (code) => {
      if (status_id) await api('deleteMessage', { chat_id, message_id: status_id });
      
      if (fullResponse.trim()) {
        const chunks = fullResponse.match(/[\s\S]{1,4000}/g) || [fullResponse];
        for (const c of chunks) await api('sendMessage', { chat_id, text: c });
      } else {
        await api('sendMessage', { chat_id, text: code === 0 ? '✅ Done.' : `❌ Error (code ${code})` });
      }
      processing = false;
      processQueue();
    });

    child.on('error', (err) => {
      console.error('Child process error:', err);
      processing = false;
      processQueue();
    });

  } catch (e) {
    console.error('Queue processing error:', e);
    processing = false;
    processQueue();
  }
}

async function handle(u) {
  const msg = u.message || u.edited_message;
  if (!msg) return;
  const chat_id = msg.chat.id;
  if (msg.from.id !== AUTH_ID) return;

  // Document Upload Handling
  if (msg.document) {
    const file = await api('getFile', { file_id: msg.document.file_id });
    if (file?.ok) {
      const fileName = msg.document.file_name || 'uploaded_file';
      const filePath = path.join(WORKSPACE_DIR, fileName);
      const res = await fetch(`${FILE_URL}/${file.result.file_path}`);
      const buffer = await res.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
      return api('sendMessage', { chat_id, text: `📥 Saved \`${fileName}\` to workspace.` });
    }
  }

  const text = msg.text;
  if (!text) return;

  // Administrative Commands
  if (text.startsWith('/')) {
    if (text === '/logs') {
      try {
        const logs = execSync(`tail -n 20 ${BRIDGE_LOG}`).toString();
        return api('sendMessage', { chat_id, text: `📝 Logs:\n\`\`\`\n${logs}\`\`\``, parse_mode: 'Markdown' });
      } catch (e) { return api('sendMessage', { chat_id, text: 'Error reading logs.' }); }
    }
    if (text === '/status') {
      return api('sendMessage', { chat_id, text: processing ? '⚡ Processing command...' : '✅ Idle.' });
    }
  }

  // Push standard messages to queue
  queue.push({ chat_id, text });
  processQueue();
}

async function poll() {
  let offset = 0;
  console.log("Gemini Telegram Bridge Active (v5)");
  while (true) {
    try {
      const res = await api('getUpdates', { offset, timeout: 30 });
      if (res?.ok) {
        for (const u of res.result) {
          offset = u.update_id + 1;
          handle(u);
        }
      } else { await new Promise(r => setTimeout(r, 5000)); }
    } catch (e) { await new Promise(r => setTimeout(r, 5000)); }
  }
}

poll();
