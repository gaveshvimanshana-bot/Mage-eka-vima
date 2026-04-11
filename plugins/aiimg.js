const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "aiimg",
  desc: "Generate AI Image (FREE)",
  category: "ai",
  filename: __filename
},
async (conn, mek, m, { from, args }) => {

  if (!args.length) {
    return await conn.sendMessage(from, {
      text: "❌ Give a prompt\nExample: .aiimg a futuristic car"
    }, { quoted: mek });
  }

  const prompt = args.join(" ");

  try {

    const url = `https://api.nekorinn.my.id/ai-image?prompt=${encodeURIComponent(prompt)}`;

    await conn.sendMessage(from, {
      image: { url: url },
      caption: `🎨 *AI Image Generated*\n\n📝 Prompt: ${prompt}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, {
      text: "❌ Error generating image"
    }, { quoted: mek });
  }

});
