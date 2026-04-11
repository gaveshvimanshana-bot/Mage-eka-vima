const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "ai",
    alias: ["chatgpt", "bot"],
    react: "🤖",
    desc: "Chat with AI",
    category: "ai",
    filename: __filename,
  },
  async (sock, mek, m, { from, q, reply }) => {
    try {

      if (!q) return reply("❌ Question ekak danna!");

      reply("🤖 Thinking...");

      // 🔥 STABLE FREE AI API
      const res = await axios.get(
        "https://api.simsimi.net/v2/",
        {
          params: {
            text: q,
            lc: "en"
          }
        }
      );

      const answer = res.data.success;

      if (!answer) return reply("❌ AI response not found!");

      await sock.sendMessage(from, {
        text: `
🤖 *AI RESPONSE*

${answer}

━━━━━━━━━━━━
⚡ VIMA-MD AI
        `
      }, { quoted: mek });

    } catch (e) {
      console.error(e);
      reply("❌ AI error: " + (e.message || "Unknown"));
    }
  }
);
