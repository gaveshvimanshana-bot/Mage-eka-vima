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

      if (!q) return reply("❌ මට question එකක් දෙන්න!");

      reply("🤖 Thinking... please wait");

      // FREE AI API (no key needed)
      const res = await axios.get("https://api.affiliateplus.xyz/api/chatbot", {
        params: {
          message: q,
          botname: "VIMA AI",
          ownername: "VIMA"
        }
      });

      const answer = res.data.message;

      if (!answer) return reply("❌ AI response නැහැ!");

      await sock.sendMessage(from, {
        text: `
🤖 *AI RESPONSE*

${answer}

━━━━━━━━━━━━━━
⚡ VIMA-MD AI BOT
        `
      }, { quoted: mek });

    } catch (e) {
      console.error(e);
      reply("❌ AI error: " + (e.message || "Unknown"));
    }
  }
);
