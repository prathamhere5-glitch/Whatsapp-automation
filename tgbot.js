// tgbot.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const shortid = require('shortid');
const schedule = require('node-schedule');

// ---------------- CONFIG ----------------
const TOKEN = process.env.BOT_TOKEN || '8111876690:AAETmnCuSI71NXKiCI2VpgtoQiTq5sVliDw';
const DATA_FILE = path.resolve(__dirname, 'data.json');

// ---------------- DATA STORE ----------------
let store = {
  accounts: {},
  links: [],
  settings: {
    delayMinutes: 5,
    activeFrom: "00:00",
    activeTo: "23:59",
    messagePool: ["Hello", "Hi", "Ping"],
    enabled: false
  },
  pairingCodes: {}
};

if (fs.existsSync(DATA_FILE)) {
  try { store = fs.readJSONSync(DATA_FILE); } catch(e) { console.error("Corrupt data.json, using blank store"); }
} else { fs.writeJSONSync(DATA_FILE, store, {spaces:2}); }

function saveStore() { fs.writeJSONSync(DATA_FILE, store, {spaces:2}); }

// ---------------- INIT BOT ----------------
const bot = new TelegramBot(TOKEN, { polling:true });
console.log("Telegram bot started.");

// ---------------- HELPERS ----------------
function makeId() { return shortid.generate(); }
function nowHM() { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function isWithinActiveRange(from, to) { const now = nowHM(); return from <= to ? now >= from && now <= to : now >= from || now <= to; }

async function sendRandomMessages(fromId, toChatId) {
  const count = Math.floor(Math.random() * 4) + 1;
  const pool = store.settings.messagePool.length ? store.settings.messagePool : ["Hello"];
  for (let i = 0; i < count; i++) {
    const msg = pool[Math.floor(Math.random() * pool.length)];
    await new Promise(r => setTimeout(r, 500 + Math.floor(Math.random() * 1500)));
    try { await bot.sendMessage(toChatId, msg); } catch(e) { console.warn(`[send] ${fromId}->${toChatId} failed`, e.message); }
  }
}

// ---------------- DISPATCHER ----------------
let dispatcherJob = null;
function startDispatcher() {
  stopDispatcher();
  dispatcherJob = schedule.scheduleJob('*/1 * * * *', async () => {
    if (!store.settings.enabled) return;
    if (!isWithinActiveRange(store.settings.activeFrom, store.settings.activeTo)) return;

    for (const link of store.links) {
      if (!link.enabled) continue;
      const acc = store.accounts[link.fromId];
      if (!acc || !acc.ready) continue;
      sendRandomMessages(link.fromId, link.toChatId);
    }
  });
}
function stopDispatcher() { if (dispatcherJob) { dispatcherJob.cancel(); dispatcherJob = null; } }

// ---------------- PAIRING ----------------
function generatePairingCode(fromId) {
  const code = shortid.generate();
  const expiresAt = Date.now() + 5*60*1000;
  store.pairingCodes[code] = { fromId, expiresAt };
  saveStore();
  return code;
}

function importPairingCode(code) {
  const info = store.pairingCodes[code];
  if (!info) return null;
  if (info.expiresAt < Date.now()) { delete store.pairingCodes[code]; saveStore(); return null; }
  const newId = makeId();
  store.accounts[newId] = { chatId: store.accounts[info.fromId].chatId, label: `Imported from ${info.fromId}`, ready: true };
  delete store.pairingCodes[code];
  saveStore();
  return newId;
}

// ---------------- TELEGRAM COMMANDS ----------------
bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  if (!Object.values(store.accounts).some(a => a.chatId === chatId)) {
    const id = makeId();
    store.accounts[id] = { chatId, label: `${msg.from.username||chatId}`, ready: true };
    saveStore();
  }
  bot.sendMessage(chatId, "Bot paired successfully! Messages will be sent automatically.");
});

bot.onText(/\/generatepair/, msg => {
  const chatId = msg.chat.id;
  const accEntry = Object.entries(store.accounts).find(([k,v])=>v.chatId===chatId);
  if (!accEntry) return bot.sendMessage(chatId,"Send /start first.");
  const code = generatePairingCode(accEntry[0]);
  bot.sendMessage(chatId, `Pairing code (5 mins): ${code}`);
});

bot.onText(/\/importpair (.+)/, (msg, match) => {
  const code = match[1].trim();
  const newId = importPairingCode(code);
  if (newId) { bot.sendMessage(msg.chat.id, "Imported successfully!"); }
  else { bot.sendMessage(msg.chat.id, "Invalid or expired code."); }
});

bot.onText(/\/addlink (\d+) (\d+)/, (msg, match) => {
  const fromId = match[1]; const toChatId = match[2];
  if (!store.accounts[fromId]) return bot.sendMessage(msg.chat.id,"Invalid fromId");
  store.links.push({ id: makeId(), fromId, toChatId, enabled: true });
  saveStore();
  bot.sendMessage(msg.chat.id,"Link added successfully.");
});

bot.onText(/\/startbot/, msg => { store.settings.enabled = true; saveStore(); startDispatcher(); bot.sendMessage(msg.chat.id,"Bot started."); });
bot.onText(/\/stopbot/, msg => { store.settings.enabled = false; saveStore(); stopDispatcher(); bot.sendMessage(msg.chat.id,"Bot stopped."); });
bot.onText(/\/setdelay (\d+)/, (msg, match) => { store.settings.delayMinutes = parseInt(match[1]); saveStore(); bot.sendMessage(msg.chat.id, `Delay set to ${match[1]} minutes.`); });
bot.onText(/\/setschedule (\d{2}:\d{2}) (\d{2}:\d{2})/, (msg, match) => { store.settings.activeFrom = match[1]; store.settings.activeTo = match[2]; saveStore(); bot.sendMessage(msg.chat.id, `Active time set from ${match[1]} to ${match[2]}.`); });

// ---------------- START ----------------
if(store.settings.enabled) startDispatcher();
