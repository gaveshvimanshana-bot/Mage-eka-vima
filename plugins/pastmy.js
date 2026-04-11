const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "pa",
  desc: "Download Past Papers",
  category: "ai",
  react: "🫟",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

  const papers = {
    science: "https://drive.google.com/uc?export=download&id=1g0CELfSKuKAp9lXGSrCACKs5BJcSUvgA&confirm=t"
  };

  let subject = args[0]?.toLowerCase();

  if (!subject) return reply("📚 Use: .pa science");
  if (!papers[subject]) return reply("❌ Not found!");

  try {

    await reply("⏳ Sending file...");

    const res = await axios({
      method: "GET",
      url: papers[subject],
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(res.data);

    await conn.sendMessage(from, {
      document: buffer,
      mimetype: "application/pdf",
      fileName: `${subject}.pdf`,
      caption: `📚 ${subject.toUpperCase()} Past Paper`
    }, { quoted: mek });

  } catch (e) {
    console.log("ERROR:", e.message);
    reply("❌ Failed to download file. Drive link block wenna puluwan.");
  }

});
