import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import QRCode from "qrcode";
import sharp from "sharp";

export const createWAClient = (sessionPath, phoneNumber, callbacks = {}) => {
  const { sendQR, sendPairCode } = callbacks;

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionPath
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    }
  });

  // ✅ QR as JPEG
  client.on("qr", async (qr) => {
    if (!sendQR) return;

    try {
      const png = await QRCode.toBuffer(qr, {
        type: "png",
        width: 600,
        margin: 2
      });

      const jpeg = await sharp(png).jpeg({ quality: 85 }).toBuffer();

      await sendQR(jpeg, "📲 Scan this on WhatsApp:\nMenu → Linked Devices → Link a device");
    } catch (e) {
      console.error("QR generation error:", e);
    }
  });

  // ✅ Optional: pairing code
  client.on("pairing_code", async (code) => {
    if (sendPairCode) await sendPairCode(code);
  });

  client.on("ready", () => {
    console.log(`✅ WhatsApp ${phoneNumber} ready`);
  });

  return {
    client,

    async init() {
      await client.initialize();
    },

    async requestPairCode() {
      const code = await client.requestPairingCode(phoneNumber);
      if (sendPairCode) await sendPairCode(code);
      return code;
    }
  };
};
