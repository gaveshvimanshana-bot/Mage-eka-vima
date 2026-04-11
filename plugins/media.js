const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd({
  pattern: "medifire",
  alias: ["mediafire", "mf"],
  desc: "Download files from MediaFire link",
  category: "ai",
  react: "📥",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

  if (!args[0]) return reply("❌ Please provide MediaFire link!\n\nExample:\n.medifire https://www.mediafire.com/file/...");

  const url = args[0];

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const fileName = $(".dl-info h1").text().trim() || "file";
    const downloadBtn = $('a#downloadButton').attr("href");

    if (!downloadBtn) return reply("❌ Download link not found!");

    await conn.sendMessage(from, {
      document: { url: downloadBtn },
      fileName: fileName,
      mimetype: "application/octet-stream"
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Error downloading file!");
  }

});
