import { Telegraf } from "telegraf";
import fs from "fs-extra";
import QRCode from "qrcode";
import sharp from "sharp";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

const bot = new Telegraf(process.env.BOT_TOKEN);

// make sessions folder
if (!fs.existsSync("sessions")) fs.mkdirSync("sessions");

let linkingState = {};

bot.start((ctx) => {
  linkingState[ctx.from.id] = null;
  ctx.reply("✅ Simple WhatsApp Link Bot\nSend /add to link account");
});

bot.command("add", (ctx) => {
  linkingState[ctx.from.id] = "WAITING_FOR_NUMBER";
  ctx.reply("📞 Send phone number with country code");
});

bot.on("text", async (ctx) => {
  const state = linkingState[ctx.from.id];
  const text = ctx.message.text;

  if (state !== "WAITING_FOR_NUMBER") return;

  const number = text.replace(/\D/g, "");
  const sessionDir = `sessions/${number}`;

  fs.ensureDirSync(sessionDir);

  ctx.reply("⏳ Connecting…");

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionDir
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
  });

  client.on("qr", async (qr) => {
    const png = await QRCode.toBuffer(qr, { type: "png", width: 500 });
    const jpeg = await sharp(png).jpeg({ quality: 90 }).toBuffer();
    await ctx.replyWithPhoto({ source: jpeg }, { caption: "📲 Scan to link WhatsApp" });
  });

  client.on("ready", () => {
    ctx.reply("✅ WhatsApp Ready!");
  });

  client.initialize();

  linkingState[ctx.from.id] = null;
});

// start polling (simple)
bot.launch().then(() => {
  console.log("✅ TG bot running (polling)");
});

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
