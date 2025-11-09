import { Markup } from "telegraf";

export const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback("🚀 Start", "START")],
  [Markup.button.callback("➕ Add Account", "ADD_ACCOUNT")],
  [Markup.button.callback("📄 List Linked Accounts", "LIST_ACCOUNTS")],
  [Markup.button.callback("⏱️ Schedule Message", "SCHEDULE")],
  [Markup.button.callback("⏳ Set Delay", "DELAY")],
  [Markup.button.callback("🛑 Stop Bot", "STOP")],
  [Markup.button.callback("👨‍💻 Developer", "DEV")]
]).resize();
