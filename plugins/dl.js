const { cmd } = require("../command");  
const axios = require("axios");  

cmd({
  pattern: "dl",
  desc: "Download media from link",
  category: "downloader",
  react: "⬇️",
  filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
  try {

    if (!q) return reply("❌ Link එකක් දෙන්න!");

    await conn.sendMessage(from, {
      react: { text: "⏳", key: mek.key }
    });

    const url = q.trim();

    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data);

    // 🧠 proper detection
    if (url.match(/\.(jpg|jpeg|png)$/i)) {
      return await conn.sendMessage(from, {
        image: buffer,
        caption: "⬇️ Downloaded Image"
      }, { quoted: mek });

    } else if (url.match(/\.(mp4)$/i)) {
      return await conn.sendMessage(from, {
        video: buffer,
        caption: "⬇️ Downloaded Video"
      }, { quoted: mek });

    } else if (url.match(/\.(mp3)$/i)) {
      return await conn.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      }, { quoted: mek });

    } else {
      return await conn.sendMessage(from, {
        document: buffer,
        fileName: "file",
        mimetype: "application/octet-stream"
      }, { quoted: mek });
    }

  } catch (e) {
    console.log(e);
    reply("❌ Download fail වුනා bn");
  }
});
