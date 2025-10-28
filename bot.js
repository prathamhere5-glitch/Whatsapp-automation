const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode');
const fs = require('fs');

const TELEGRAM_TOKEN = '8111876690:AAH28e-37x48Q-NxrccgdOjkt9dfdwpqk0w';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Store sessions per user
const userSockets = new Map();

async function connectToWhatsApp(chatId) {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth_${chatId}`);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            const qrImagePath = `./qr_${chatId}.png`;
            await qrcode.toFile(qrImagePath, qr);
            await bot.sendPhoto(chatId, fs.createReadStream(qrImagePath), {
                caption: 'Scan this QR code with WhatsApp to connect.'
            });
            fs.unlinkSync(qrImagePath);
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp(chatId);
            } else {
                await bot.sendMessage(chatId, 'WhatsApp disconnected. Type /connect to reconnect.');
            }
        } else if (connection === 'open') {
            await bot.sendMessage(chatId, 'WhatsApp connected successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
    userSockets.set(chatId, sock);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Welcome! Type /connect to start WhatsApp connection via QR code.');
    } else if (text === '/connect') {
        await connectToWhatsApp(chatId);
    } else if (/^\+\d{10,15}$/.test(text)) {
        // For pairing code: Baileys supports linking via phone number
        // Example: await sock.requestPairingCode(text); then handle event
        await bot.sendMessage(chatId, 'Pairing via number not fully implemented in this example—check Baileys docs for details.');
    }
});
