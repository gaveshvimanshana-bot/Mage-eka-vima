const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

cmd({
  pattern: "gdrive",
  alias: ["gd", "drive"],
  desc: "Google Drive downloader",
  category: "ai",
  react: "📥",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

  if (!args[0]) return reply("❌ Google Drive link එකක් දෙන්න!\n\nExample:\n.gdrive https://drive.google.com/file/d/xxxx/view");

  const fileId = extractFileId(args[0]);
  if (!fileId) return reply("❌ Invalid Google Drive link!");

  try {

    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const res = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    const disposition = res.headers["content-disposition"];
    let fileName = "file";

    if (disposition) {
      const match = disposition.match(/filename="(.+)"/);
      if (match) fileName = match[1];
    }

    const filePath = path.join(__dirname, fileName);

    const writer = fs.createWriteStream(filePath);

    let downloaded = 0;
    const total = res.headers["content-length"];

    const msg = await conn.sendMessage(from, {
      text: "⏳ Download starting..."
    }, { quoted: mek });

    res.data.on("data", (chunk) => {
      downloaded += chunk.length;

      if (total) {
        const percent = Math.floor((downloaded / total) * 100);

        if (percent % 5 === 0) {
          conn.sendMessage(from, {
            text: `📥 *Google Drive Download*\n\n📄 ${fileName}\n📊 Progress: ${percent}%`
          }, { quoted: msg });
        }
      }
    });

    res.data.pipe(writer);

    writer.on("finish", async () => {

      await conn.sendMessage(from, {
        document: fs.readFileSync(filePath),
        fileName,
        mimetype: "application/octet-stream"
      }, { quoted: mek });

      fs.unlinkSync(filePath);
    });

    writer.on("error", () => {
      reply("❌ File save error!");
    });

  } catch (e) {
    console.log(e);
    reply("❌ Download failed! Maybe file is too big or restricted.");
  }

});
