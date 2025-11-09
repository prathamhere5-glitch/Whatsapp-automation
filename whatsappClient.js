// file: whatsappClient.js (ESM)
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

export const createWAClient = (sessionPath, phoneNumber, sendPairCode) => {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }
  });

  client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
  client.on('pairing_code', async (code) => { await sendPairCode(code); });
  client.on('ready', () => console.log(`✅ WhatsApp ${phoneNumber} ready`));

  return client;
};
