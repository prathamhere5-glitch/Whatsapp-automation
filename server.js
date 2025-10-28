import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { Telegraf } from 'telegraf';
import QRCode from 'qrcode';
import fs from 'fs';

const TELEGRAM_BOT_TOKEN = '8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w';
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const clients = new Map();

bot.command('connect', async (ctx) => {
  const userId = ctx.from.id;
  if (clients.has(userId)) {
    return ctx.reply('⚠️ WhatsApp already linked.');
  }

  ctx.reply('📲 Initializing WhatsApp...');
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: String(userId) }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', async (qr) => {
    const file = `qr_${userId}.png`;
    await QRCode.toFile(file, qr);
    await ctx.replyWithPhoto({ source: file }, { caption: '📸 Scan this QR to link WhatsApp' });
    fs.unlinkSync(file);
  });

  client.on('ready', () => {
    ctx.reply('✅ WhatsApp Connected!');
  });

  client.on('message', msg => {
    if (msg.body === '!ping') msg.reply('pong');
  });

  client.initialize();
  clients.set(userId, client);
});

bot.launch().then(() => console.log('🚀 Telegram bot ready on Render!'));
