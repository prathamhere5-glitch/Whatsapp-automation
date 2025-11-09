import { Markup } from "telegraf";

export const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback("➕ Add Account", "ADD_ACCOUNT")],
  [Markup.button.callback("📄 List Linked Accounts", "LIST_ACCOUNTS")],
  [Markup.button.callback("🔢 Pairing Code Login", "PAIRING")],
  [Markup.button.callback("🔳 QR Login", "QR_LOGIN")],
  [Markup.button.callback("🛑 Stop", "STOP")]
]).resize();
