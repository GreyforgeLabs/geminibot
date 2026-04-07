import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// --- CONFIGURATION (Environment Variables) ---
const TOKEN = process.env.TELEGRAM_TOKEN;
const AUTH_ID = parseInt(process.env.AUTHORIZED_USER_ID, 10);
const SESSION_ID = process.env.GEMINI_SESSION_ID;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || process.cwd();
const BRIDGE_LOG = process.env.BRIDGE_LOG_PATH || './bot.log';
const MAX_QUEUE_SIZE = 20;
const GEMINI_TIMEOUT_MS = 5 * 60_000;

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
    console.log(`\n[${new Date().toLocaleTimeString()}] Executing: ${text}`);
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
    });

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
    }, GEMINI_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Child process error:', err);
      processing = false;
      processQueue();
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
      clearTimeout(timeout);
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

  } catch (e) {
    console.error('Queue processing error:', e);
    processing = false;
    processQueue();
  }
}

async function readRecentLogs(logPath, lines = 20) {
  const maxLines = Math.max(1, Math.min(lines, 200));
  const resolved = path.resolve(WORKSPACE_DIR, logPath);
  const contents = await fs.readFile(resolved, 'utf8');
  const rows = contents.replace(/\r?\n$/, '').split(/\r?\n/);
  return rows.slice(-maxLines).join('\n');
}

function sanitizeFileName(fileName) {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return base || 'uploaded_file';
}

async function handle(u) {
  const msg = u.message || u.edited_message;
  if (!msg) return;
  const chat_id = msg.chat.id;
  if (msg.from.id !== AUTH_ID) return;

  let fileNotification = "";

  // 1. Photo/Document Handling (Multimodal)
  let file_id = null;
  let fileName = null;

  if (msg.document) {
    file_id = msg.document.file_id;
    fileName = msg.document.file_name || 'uploaded_file';
  } else if (msg.photo) {
    file_id = msg.photo[msg.photo.length - 1].file_id;
    fileName = `photo_${Date.now()}.jpg`;
  }

  if (file_id) {
    const file = await api('getFile', { file_id });
    if (file?.ok) {
      const safeName = sanitizeFileName(fileName ?? 'uploaded_file');
      const filePath = path.join(WORKSPACE_DIR, safeName);
      const res = await fetch(`${FILE_URL}/${file.result.file_path}`);
      const buffer = await res.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
      fileNotification = `📥 File \`${fileName}\` saved to workspace. `;
      console.log(`[FILE] Saved: ${fileName}`);
    }
  }

  const text = msg.text || msg.caption || "";
  if (fileNotification && !text) {
    return api('sendMessage', { chat_id, text: fileNotification, parse_mode: 'Markdown' });
  }
  if (!text) return;

  // Administrative Commands
  if (text.startsWith('/')) {
    if (text === '/logs') {
      try {
        const logs = await readRecentLogs(BRIDGE_LOG, 20);
        return api('sendMessage', { chat_id, text: `📝 Logs:\n\`\`\`\n${logs}\`\`\``, parse_mode: 'Markdown' });
      } catch (e) {
        return api('sendMessage', { chat_id, text: 'Error reading logs.' });
      }
    }
    if (text === '/status') {
      return api('sendMessage', { chat_id, text: processing ? '⚡ Processing command...' : '✅ Idle.' });
    }
  }

  // Push standard messages to queue
  const finalPrompt = fileNotification ? `${fileNotification}\nUser Request: ${text}` : text;
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('[GeminiBot] Queue full — request discarded');
    return api('sendMessage', { chat_id, text: '⚠️ Queue is full, try again shortly.' });
  }
  queue.push({ chat_id, text: finalPrompt });
  processQueue();
}

async function poll() {
  let offset = 0;
  console.log("Gemini Telegram Bridge Active (v7 - Multimodal)");
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
