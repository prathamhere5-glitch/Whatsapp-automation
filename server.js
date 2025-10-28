import TelegramBot from "node-telegram-bot-api";
import pkg from "whatsapp-web.js";
import qrcode from "qrcode";

const { Client, LocalAuth } = pkg;

// 🔹 Replace with your Telegram bot token
const TELEGRAM_BOT_TOKEN = "8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w";

// Create Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Store WhatsApp client
let client;

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "👋 Welcome! Send /link to connect your WhatsApp account."
  );
});

// Link command
bot.onText(/\/link/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "📲 Initializing WhatsApp... please wait.");

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "user-session" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--single-process",
        "--no-zygote",
      ],
    },
  });

  client.on("qr", async (qr) => {
    const qrImage = await qrcode.toBuffer(qr);
    await bot.sendPhoto(chatId, qrImage, {
      caption: "📱 Scan this QR with your WhatsApp to link your account.",
    });
  });

  client.on("ready", () => {
    bot.sendMessage(chatId, "✅ WhatsApp client is ready!");
  });

  client.on("disconnected", (reason) => {
    bot.sendMessage(chatId, `⚠️ WhatsApp disconnected: ${reason}`);
  });

  client.initialize();
});
