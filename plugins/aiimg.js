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

    const res = await axios.post("https://es24.in/art/dev_api.php", {
      prompt: prompt,
      style: 1, // 1=real, 2=anime, 3=3D, 4=cyberpunk
      ratio: "1:1"
    });

    const img = res.data.image || res.data.url;

    await conn.sendMessage(from, {
      image: { url: img },
      caption: `🎨 *AI Image Generated*\n\n📝 Prompt: ${prompt}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, {
      text: "❌ Error generating image"
    }, { quoted: mek });
  }

});
