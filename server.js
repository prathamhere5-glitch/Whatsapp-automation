import express from 'express';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { Telegraf } from 'telegraf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ----------------- Config (replace token) -----------------
const TELEGRAM_TOKEN = '8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w'; // <-- REPLACE
const PORT = process.env.PORT || 3000;
// ----------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const bot = new Telegraf(TELEGRAM_TOKEN);

// store per-telegram-user WhatsApp client instances
const linkedAccounts = new Map();

/**
 * Helper: returns puppeteer args (Render-friendly).
 * Puppeteer package will download Chromium during npm install.
 */
const puppeteerOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-zygote',
    '--single-process'
  ]
};

// ---- Telegram commands ----
bot.start((ctx) => {
  ctx.reply('👋 Welcome. Use /link to connect WhatsApp (one session per Telegram user).');
});

bot.command('link', async (ctx) => {
  const userId = String(ctx.from.id);

  if (linkedAccounts.has(userId)) {
    return ctx.reply('⚠️ You already have a linked WhatsApp session. Use /unlink to remove it.');
  }

  await ctx.reply('🔄 Initializing WhatsApp client...');

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `tg_${userId}` }),
    puppeteer: puppeteerOptions
  });

  client.on('qr', async (qr) => {
    try {
      const filePath = path.join(__dirname, `qr_${userId}.png`);
      await QRCode.toFile(filePath, qr);
      await ctx.replyWithPhoto({ source: filePath }, { caption: '📲 Scan this QR code with WhatsApp to link.' });
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to send QR image:', err);
      await ctx.reply('❌ Failed to send QR. Check logs.');
    }
  });

  client.on('ready', () => {
    ctx.reply('✅ WhatsApp connected successfully!');
    linkedAccounts.set(userId, client);
  });

  client.on('disconnected', (reason) => {
    console.log(`WhatsApp client for ${userId} disconnected:`, reason);
    linkedAccounts.delete(userId);
  });

  client.on('message', (msg) => {
    try {
      if (msg.body === '!ping') msg.reply('pong');
    } catch (e) {
      console.error('message handler error:', e);
    }
  });

  try {
    await client.initialize();
    // note: ready event will confirm connection
  } catch (err) {
    console.error('Failed to initialize client:', err);
    await ctx.reply('❌ Failed to start WhatsApp client. Check logs.');
  }
});

bot.command('unlink', async (ctx) => {
  const userId = String(ctx.from.id);
  const client = linkedAccounts.get(userId);
  if (!client) return ctx.reply('ℹ️ No linked WhatsApp session found.');

  try {
    await client.destroy();
  } catch (e) {
    console.warn('Error destroying client:', e);
  }
  linkedAccounts.delete(userId);
  return ctx.reply('✅ WhatsApp session unlinked and removed.');
});

// keep-alive web route
app.get('/', (req, res) => {
  res.send('✅ WhatsApp-Telegram bot running');
});

// Start Express + Telegram bot
app.listen(PORT, () => {
  console.log(`🌍 Server listening on port ${PORT}`);
});

bot.launch()
  .then(() => console.log('🚀 Telegram bot launched'))
  .catch((err) => {
    console.error('Failed to launch Telegram bot:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
  client.on('message', msg => {
    if (msg.body === '!ping') msg.reply('pong');
  });

  client.initialize();
  clients.set(userId, client);
});

bot.launch().then(() => console.log('🚀 Telegram bot ready on Render!'));
