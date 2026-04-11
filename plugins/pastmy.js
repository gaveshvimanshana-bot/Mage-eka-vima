const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "pa",
  desc: "Download Past Paper",
  category: "ai",
  react: "🔥",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {

  try {

    const url = "https://drive.google.com/uc?export=download&id=1g0CELfSKuKAp9lXGSrCACKs5BJcSUvgA";

    // 🔥 Download file as buffer
    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data);

    // 📄 Send file
    await conn.sendMessage(from, {
      document: buffer,
      mimetype: "application/pdf",
      fileName: "PastPaper.pdf",
      caption: "📚 Past Paper Download"
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Error downloading file! Try again.");
  }

});
