import express from "express";
import { Telegraf } from "telegraf";
import QRCode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 10000;

// Telegram bot setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w");
let telegramChatId = null;

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./sessions" }),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
        executablePath: puppeteer.executablePath()
    }
});

// Start Express server (Render requires this)
app.get("/", (req, res) => res.send("✅ WhatsApp-Telegram Bridge is running!"));
app.listen(PORT, () => console.log(`🌐 Server live on port ${PORT}`));

// WhatsApp Events
client.on("qr", async (qr) => {
    console.log("📲 QR Code generated. Sending to Telegram...");
    if (telegramChatId) {
        const qrImage = await QRCode.toBuffer(qr);
        await bot.telegram.sendPhoto(telegramChatId, { source: qrImage }, { caption: "📱 Scan this QR to link WhatsApp!" });
    } else {
        console.log("⚠️ Telegram chat not initialized. Send /start in your bot first.");
    }
});

client.on("ready", () => {
    console.log("✅ WhatsApp is ready!");
    if (telegramChatId) bot.telegram.sendMessage(telegramChatId, "✅ WhatsApp connected successfully!");
});

client.on("message", async (msg) => {
    console.log(`💬 [WhatsApp] ${msg.from}: ${msg.body}`);
    if (telegramChatId) {
        await bot.telegram.sendMessage(telegramChatId, `📩 *${msg.from}*: ${msg.body}`, { parse_mode: "Markdown" });
    }
});

// Telegram commands
bot.start((ctx) => {
    telegramChatId = ctx.chat.id;
    ctx.reply("👋 Welcome! Send /link to connect WhatsApp.");
});

bot.command("link", async (ctx) => {
    telegramChatId = ctx.chat.id;
    ctx.reply("🔗 Initializing WhatsApp connection... please wait 5–10 seconds for QR.");
    client.initialize();
});

bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    if (!client.info || !client.info.wid) {
        return ctx.reply("⚠️ WhatsApp not connected. Use /link first.");
    }
    const chats = await client.getChats();
    const chat = chats.find(c => c.isGroup === false);
    if (chat) {
        await chat.sendMessage(text);
        ctx.reply(`✅ Sent to WhatsApp: ${text}`);
    } else {
        ctx.reply("❌ No private chat found on WhatsApp.");
    }
});

bot.launch();
