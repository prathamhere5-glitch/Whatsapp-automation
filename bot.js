import { Telegraf } from "telegraf";
import express from "express";
import { mainMenu } from "./ui.js";
import { createAccountFolder, listAccounts } from "./accountManager.js";
import { createWAClient } from "./whatsappClient.js";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN not set!");
  process.exit(1);
}

const bot = new Telegraf(token);
const app = express();
app.use(express.json());

let linkingState = {}; // temp state

// ✅ Start command
bot.start(async (ctx) => {
  linkingState[ctx.from.id] = null;
  await ctx.reply("✅ Welcome to the WhatsApp Multi-Link Bot!", mainMenu);
});

// ✅ Add Account
bot.action("ADD_ACCOUNT", async (ctx) => {
  linkingState[ctx.from.id] = "WAITING_FOR_NUMBER";
  await ctx.reply("📞 Send the WhatsApp phone number (with country code)");
});

// ✅ User sent a number
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const state = linkingState[userId];

  if (state === "WAITING_FOR_NUMBER") {
    const number = ctx.message.text.replace(/\D/g, "");

    const sessionPath = createAccountFolder(userId, number);

    await ctx.reply(`🔗 Linking WhatsApp Account: *${number}*\nPlease wait...`, { parse_mode: "Markdown" });

    const wa = createWAClient(sessionPath, number, {
      sendQR: async (jpeg, caption) => {
        await ctx.replyWithPhoto({ source: jpeg }, { caption });
      },
      sendPairCode: async (code) => {
        await ctx.reply(`🔑 Pairing code:\n\`${code}\``, { parse_mode: "Markdown" });
      }
    });

    await wa.init();

    linkingState[userId] = null;
  }
});

// ✅ List accounts
bot.action("LIST_ACCOUNTS", async (ctx) => {
  const accounts = listAccounts(ctx.from.id);

  if (accounts.length === 0) {
    await ctx.reply("❌ No accounts linked yet.");
    return;
  }

  let msg = "📄 *Your Linked Accounts:*\n\n";
  accounts.forEach((a) => (msg += `✅ ${a}\n`));

  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// ✅ Webhook setup (RENDER)
const domain = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT || 10000;
const path = `/webhook/${bot.secretPathComponent()}`;

app.use(path, bot.webhookCallback(path));

if (domain) {
  bot.telegram.setWebhook(`${domain}${path}`).then(() => {
    app.listen(port, () => {
      console.log(`✅ Bot running (webhook) → ${domain}${path}`);
    });
  });
} else {
  // local fallback
  bot.launch().then(() => {
    console.log("✅ Bot running (polling)");
  });
}    });

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
