const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

cmd({
  pattern: "sticker",
  alias: ["s", "st"],
  desc: "Convert image/video to sticker",
  react: "🧩",
  category: "media",
  filename: __filename
},
async (conn, mek, m, { from, quoted }) => {

  try {

    if (!quoted) {
      return await conn.sendMessage(from, { text: "❌ Reply to an image or video!" }, { quoted: mek });
    }

    let mime = quoted.mtype || "";

    if (!/image|video/.test(mime)) {
      return await conn.sendMessage(from, { text: "❌ Only image or video allowed!" }, { quoted: mek });
    }

    let stream = await downloadContentFromMessage(quoted.message, mime.includes("video") ? "video" : "image");

    let buffer = Buffer.from([]);

    for await (let chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    let filePath = path.join(__dirname, "../temp/sticker.webp");

    fs.writeFileSync(filePath, buffer);

    await conn.sendMessage(from, {
      sticker: fs.readFileSync(filePath)
    }, { quoted: mek });

    fs.unlinkSync(filePath);

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Sticker create failed!" }, { quoted: mek });
  }

});
