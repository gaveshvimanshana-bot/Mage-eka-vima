const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "insta",
  desc: "Download Instagram videos",
  category: "download",
  react:"🫟",
  filename: __filename
},
async (conn, mek, m, { from, args }) => {

  if (!args[0]) {
    return await conn.sendMessage(from, { 
      text: "❌ Please give Instagram link\nExample: .insta https://www.instagram.com/reel/xxxxx/" 
    }, { quoted: mek });
  }

  const url = args[0];

  try {

    // Free API එකක් use කරනවා
    const api = `https://api.neoxr.eu/api/ig?url=${encodeURIComponent(url)}`;

    const res = await axios.get(api);
    const data = res.data;

    if (!data.status) {
      return await conn.sendMessage(from, { text: "❌ Download failed" }, { quoted: mek });
    }

    const video = data.data[0].url;

    await conn.sendMessage(from, {
      video: { url: video },
      caption: "✅ Instagram Video Downloaded"
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Error downloading video" }, { quoted: mek });
  }

});
