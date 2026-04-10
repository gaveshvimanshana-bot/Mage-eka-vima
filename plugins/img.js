const { cmd } = require("../command");

cmd({
  pattern: "img",
  desc: "Advanced Free AI Image Generator",
  category: "ai",
  react: "🖼️",
  filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
  try {

    // ⛔ no prompt check
    if (!q) return reply("❌ Prompt !\n\nEx: .img anime girl cyberpunk");

    // ⏳ loading reaction
    await conn.sendMessage(from, {
      react: { text: "⏳", key: mek.key }
    });

    // 🧼 clean prompt
    let prompt = q.trim();

    // 🎨 auto quality boost
    const styles = [
      "ultra HD",
      "4K",
      "cinematic lighting",
      "high detail",
      "sharp focus",
      "anime style"
    ];

    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    prompt = `${prompt}, ${randomStyle}`;

    // 🌐 FREE IMAGE API
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    // 📤 send image
    await conn.sendMessage(from, {
      image: { url },
      caption: `🖼️ *AI IMAGE GENERATED*\n\n📝 Prompt: ${q}\n🎨 Style: ${randomStyle}\n⚡ Free AI Engine`
    }, { quoted: mek });

  } catch (e) {
    console.log("IMG ERROR:", e);

    reply("❌ Image generate fail 😢\nTry again later");
  }
});
