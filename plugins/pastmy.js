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

  let subject = args[0];

  if (!subject) {
    return reply("📚 Use:\n.pastpaper science");
  }

  subject = subject.toLowerCase();

  if (!papers[subject]) {
    return reply("❌ Not found! Use: science");
  }

  try {

    await reply("⏳ Sending " + subject + "...");

    const res = await axios.get(papers[subject], {
      responseType: "arraybuffer"
    });

    await conn.sendMessage(from, {
      document: Buffer.from(res.data),
      mimetype: "application/pdf",
      fileName: `${subject}.pdf`,
      caption: `📚 ${subject.toUpperCase()} Past Paper`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Failed! Drive link check karanna.");
  }

});
