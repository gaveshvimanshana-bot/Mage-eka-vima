const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

function makeBar(percent) {
  const totalBlocks = 10;
  const filledBlocks = Math.round((percent / 100) * totalBlocks);

  const filled = "█".repeat(filledBlocks);
  const empty = "░".repeat(totalBlocks - filledBlocks);

  return `${filled}${empty} ${percent}%`;
}

cmd({
  pattern: "medifire",
  alias: ["mediafire", "mf"],
  desc: "MediaFire downloader with progress bar",
  category: "downloader",
  react: "📥",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

  if (!args[0]) return reply("❌ MediaFire link එකක් දෙන්න!\nExample:\n.medifire <link>");

  const url = args[0];

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const fileName = $(".dl-info h1").text().trim() || "file";
    const downloadUrl = $('a#downloadButton').attr("href");

    if (!downloadUrl) return reply("❌ Download link not found!");

    const filePath = path.join(__dirname, fileName);

    const startMsg = await conn.sendMessage(from, {
      text: "⏳ Download starting..."
    }, { quoted: mek });

    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const totalLength = response.headers['content-length'];

    let downloaded = 0;
    let lastUpdate = 0;

    const writer = fs.createWriteStream(filePath);

    response.data.on("data", (chunk) => {
      downloaded += chunk.length;

      const percent = Math.floor((downloaded / totalLength) * 100);

      if (percent !== lastUpdate && percent % 3 === 0) {
        lastUpdate = percent;

        const bar = makeBar(percent);

        conn.sendMessage(from, {
          text: `📥 *Downloading File*\n\n📄 ${fileName}\n${bar}`
        }, { quoted: startMsg });
      }
    });

    response.data.pipe(writer);

    writer.on("finish", async () => {
      const bar = makeBar(100);

      await conn.sendMessage(from, {
        text: `✅ *Download Completed!*\n\n📄 ${fileName}\n${bar}`
      }, { quoted: mek });

      await conn.sendMessage(from, {
        document: fs.readFileSync(filePath),
        fileName: fileName,
        mimetype: "application/octet-stream"
      }, { quoted: mek });

      fs.unlinkSync(filePath);
    });

    writer.on("error", () => {
      reply("❌ File write error!");
    });

  } catch (e) {
    console.log(e);
    reply("❌ Error occurred!");
  }

});
