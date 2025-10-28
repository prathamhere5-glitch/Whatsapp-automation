import express from 'express';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { Telegraf } from 'telegraf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TELEGRAM_TOKEN = '8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w'; // 🔹 Replace this
const PORT = process.env.PORT || 3000;

const app = express();
const bot = new Telegraf(TELEGRAM_TOKEN);
let linkedAccounts = {}; // { telegramUserId: whatsappClient }

// Chromium path for Render
const CHROME_PATH = '/usr/bin/chromium' || '/usr/bin/chromium-browser';

// ✅ Telegram Start Command
bot.start((ctx) => {
  ctx.reply('👋 Welcome! Use /link to connect your WhatsApp account.');
});

// ✅ Link WhatsApp
bot.command('link', async (ctx) => {
  const userId = ctx.from.id;

  if (linkedAccounts[userId]) {
    return ctx.reply('✅ WhatsApp already linked.');
  }

  ctx.reply('🔄 Connecting to WhatsApp...');

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `user_${userId}` }),
    puppeteer: {
      headless: true,
      executablePath: CHROME_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ],
    },
  });

  client.on('qr', async (qr) => {
    const filePath = path.join(__dirname, `qr_${userId}.png`);
    await QRCode.toFile(filePath, qr);
    await ctx.replyWithPhoto({ source: filePath }, { caption: '📲 Scan this QR to connect your WhatsApp.' });
    fs.unlinkSync(filePath);
  });

  client.on('ready', () => {
    ctx.reply('✅ WhatsApp connected successfully!');
    linkedAccounts[userId] = client;
  });

  client.on('message', (msg) => {
    if (msg.body === '!ping') {
      client.sendMessage(msg.from, 'pong 🏓');
    }
  });

  await client.initialize();
});

// Express keep-alive server
app.get('/', (req, res) => {
  res.send('✅ WhatsApp-Telegram Bot Running');
});

// Start server + bot
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
bot.launch().then(() => console.log('🚀 Telegram bot launched successfully'));
