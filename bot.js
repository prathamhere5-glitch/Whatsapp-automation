require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const { default: makeWASocket, useMultiFileAuthState, delay, disconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const vcf = require('vcf');
const fs = require('fs');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

const REQUIRED_CHANNEL = "@YourChannel"; // Change this
const ADMIN_ID = 123456789; // Change this
const sessions = new Map(); // Store active WA sockets

// --- Helper: Force Subscription Check ---
async function isSubscribed(ctx) {
    try {
        const member = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, ctx.from.id);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (e) { return false; }
}

// --- Helper: Premium Check (Mockup) ---
function isPremium(userId) {
    // Integrate your DB here. Returning true for development.
    return true; 
}

// --- WhatsApp Worker Logic ---
async function connectToWhatsApp(ctx, phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${ctx.from.id}`);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                await ctx.reply(`🔢 **Pairing Code:** \`${code}\`\n\nSteps:\n1. Open WhatsApp > Linked Devices\n2. Link with phone number\n3. Enter code above.`);
            } catch (e) {
                ctx.reply("❌ Error requesting code. Ensure country code is included (e.g., 1415...)");
            }
        }, 3000);
    }

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
            ctx.reply("✅ WhatsApp Connected! Send your .VCF file and message.");
            sessions.set(ctx.from.id, sock);
        }
    });

    return sock;
}

// --- Bot Commands ---
bot.start(async (ctx) => {
    if (!(await isSubscribed(ctx))) {
        return ctx.reply(`❌ Access Denied. Join ${REQUIRED_CHANNEL} first!`, Markup.inlineKeyboard([
            [Markup.button.url("Join Channel", `https://t.me/${REQUIRED_CHANNEL.replace('@','')}`)]
        ]));
    }
    ctx.reply("Welcome. Enter your phone number with country code to link WhatsApp (e.g., 14151234567):");
});

// Handle Phone Number Input
bot.on('text', async (ctx) => {
    if (ctx.message.text.match(/^\d+$/)) {
        ctx.reply("⏳ Requesting pairing code...");
        await connectToWhatsApp(ctx, ctx.message.text);
    } else if (ctx.session?.awaitingMessage) {
        ctx.session.broadcastMsg = ctx.message.text;
        ctx.session.awaitingMessage = false;
        ctx.reply("⚡ Choose Sending Speed:", Markup.inlineKeyboard([
            [Markup.button.callback('Slow (30s delay)', 'speed_30'), Markup.button.callback('Fast (10s delay)', 'speed_10')]
        ]));
    }
});

// Handle VCF Upload
bot.on('document', async (ctx) => {
    if (!isPremium(ctx.from.id)) return ctx.reply("💎 Purchase Premium to upload contact lists.");
    
    const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);
    const response = await axios.get(fileLink.href);
    const cards = vcf.parse(response.data);
    
    const numbers = cards.map(c => {
        const tel = c.get('tel');
        return Array.isArray(tel) ? tel[0].valueOf() : tel?.valueOf();
    }).filter(n => n).map(n => n.replace(/\D/g, ''));

    ctx.session.contacts = numbers;
    ctx.session.awaitingMessage = true;
    ctx.reply(`📂 Parsed ${numbers.length} contacts. Now, type the message you want to send:`);
});

// Handle Speed Selection & Execution
bot.action(/speed_(\d+)/, async (ctx) => {
    const delayTime = parseInt(ctx.match[1]) * 1000;
    const sock = sessions.get(ctx.from.id);
    const contacts = ctx.session.contacts;
    const msg = ctx.session.broadcastMsg;

    if (!sock) return ctx.reply("❌ Session lost. Link again.");

    ctx.answerCbQuery("🚀 Starting Broadcast...");
    
    for (let i = 0; i < contacts.length; i++) {
        try {
            await sock.sendMessage(`${contacts[i]}@s.whatsapp.net`, { text: msg });
            await delay(delayTime);
            if (i % 5 === 0) ctx.reply(`Sent: ${i + 1}/${contacts.length}`);
        } catch (e) {
            console.error(`Failed: ${contacts[i]}`);
        }
    }
    ctx.reply("🏁 Done!");
});

bot.launch();
