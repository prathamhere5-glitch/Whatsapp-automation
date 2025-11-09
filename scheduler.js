import schedule from "node-schedule";

export const scheduleMessage = (client, chatId, text, time) => {
  schedule.scheduleJob(time, () => {
    client.sendMessage(chatId, text);
  });
};
