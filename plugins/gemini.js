const { cmd } = require("../command");
const axios = require("axios");

const API_KEY = "AIzaSyBY1e7YMrz7gtzuZhFOzCoQQcrEGfzqTvI";

cmd({
  pattern: "ai",
  desc: "Chat with Gemini AI",
  category: "ai",
  react: "🤖",
  filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) return reply("❌ Question ekak denna!");

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: q }]
          }
        ]
      }
    );

    const text = res.data.candidates[0].content.parts[0].text;

    reply(`🤖 Gemini:\n\n${text}`);

  } catch (e) {
    console.log(e.response?.data || e.message);
    reply("❌ Gemini error ekak awa!");
  }
});
