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
    science: "https://drive.google.com/uc?export=download&id=1g0CELfSKuKAp9lXGSrCACKs5BJcSUvgA",
    maths: "",
    ict: ""
  };

  let subject = args[0]?.toLowerCase();

  if (!subject || !papers[subject]) {
    return reply("📚 Use:\n.pastpaper science\n.pastpaper maths\n.pastpaper ict");
  }

  try {

    await reply("⏳ Downloading " + subject + "...");

    const response = await axios.get(papers[subject], {
      responseType: "arraybuffer"
    });

    await conn.sendMessage(from, {
      document: Buffer.from(response.data),
      mimetype: "application/pdf",
      fileName: `${subject}_pastpaper.pdf`,
      caption: `✅ ${subject.toUpperCase()} Past Paper`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Error! Check link or file.");
  }

});
