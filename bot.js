import { Telegraf } from "telegraf";
import { mainMenu } from "./ui.js";
import { ensureUserFolder, createAccountFolder, listAccounts } from "./accountManager.js";
import { createWAClient } from "./whatsappClient.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

let linkingState = {};  // temporary state machine

bot.start(async (ctx) => {
  await ctx.reply("✅ Welcome to the Multi WhatsApp Linker Bot!", mainMenu);
});

bot.action("START", async (ctx) => {
  await ctx.editMessageText("✅ Bot is running!", mainMenu);
});

bot.action("ADD_ACCOUNT", async (ctx) => {
  ctx.reply("📞 Send the phone number of the WhatsApp account you want to link:");
  linkingState[ctx.from.id] = "WAITING_FOR_NUMBER";
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (linkingState[userId] === "WAITING_FOR_NUMBER") {
    const number = text.replace(/\D/g, "");
    const sessionPath = createAccountFolder(userId, number);

    ctx.reply(`🔗 Linking WhatsApp account: *${number}*\n\nGenerating pairing code...`, { parse_mode: "Markdown" });

    const client = createWAClient(sessionPath, number, async (code) => {
      await ctx.reply(`🔑 *Your pairing code:*\n\n\`${code}\`\n\n✅ Enter it on WhatsApp!`, {
        parse_mode: "Markdown"
      });
    });

    client.initialize();

    linkingState[userId] = null;
  }
});

bot.action("LIST_ACCOUNTS", async (ctx) => {
  const accounts = listAccounts(ctx.from.id);

  if (accounts.length === 0) {
    return ctx.reply("❌ No accounts linked.");
  }

  let result = "📄 *Your Linked Accounts:*\n\n";
  accounts.forEach(a => result += `✅ ${a}\n`);

  ctx.reply(result, { parse_mode: "Markdown" });
});

bot.action("DEV", async (ctx) => {
  ctx.reply("👨‍💻 Developer: @yourusername\n⚡ Professional Multi-Account WhatsApp Bot Developer.");
});

bot.launch();
console.log("✅ Telegram bot running...");
