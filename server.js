import express from "express";
import { Telegraf } from "telegraf";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w");
let linkedAccounts = {};

// Telegram start command
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome!\n\nUse the buttons below to manage WhatsApp automation.",
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➕ Add Account", callback_data: "add_account" },
            { text: "📋 List Accounts", callback_data: "list_accounts" },
          ],
          [
            { text: "▶️ Start Messaging", callback_data: "start_messaging" },
            { text: "⏹ Stop Messaging", callback_data: "stop_messaging" },
          ],
        ],
      },
    }
  );
});

// Handle button actions
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;

  switch (data) {
    case "add_account":
      ctx.reply("📲 Use the pairing code to link your WhatsApp account...");
      // (Puppeteer logic here)
      break;

    case "list_accounts":
      if (Object.keys(linkedAccounts).length === 0) {
        ctx.reply("❌ No linked accounts yet.");
      } else {
        const list = Object.keys(linkedAccounts)
          .map((id, i) => `${i + 1}. ${id}`)
          .join("\n");
        ctx.reply(`🔗 Linked Accounts:\n${list}`);
      }
      break;

    case "start_messaging":
      ctx.reply("🚀 Messaging started!");
      break;

    case "stop_messaging":
      ctx.reply("🛑 Messaging stopped.");
      break;

    default:
      ctx.reply("❓ Unknown option");
      break;
  }

  await ctx.answerCbQuery();
});

bot.launch();
app.get("/", (req, res) => res.send("Bot is running on Render 🚀"));
app.listen(port, () => console.log(`Server started on port ${port}`));
