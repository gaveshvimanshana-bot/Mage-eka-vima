const { cmd } = require("../command");

cmd({
  pattern: "pastpaper",
  desc: "Download Past Paper",
  category: "ai",
  react: "✔️",
  filename: __filename
},
async (conn, mek, m, { from }) => {

  const url = "https://drive.google.com/uc?export=download&id=1g0CELfSKuKAp9lXGSrCACKs5BJcSUvgA";

  await conn.sendMessage(from, {
    document: { url: url },
    mimetype: "application/pdf",
    fileName: "PastPaper.pdf",
    caption: "📚 Past Paper Download"
  }, { quoted: mek });

});
