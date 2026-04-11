const axios = require("axios");
const { cmd } = require("../command");

cmd(
  {
    pattern: "ai",
    alias: ["pp", "pastpaper"],
    react: "📚",
    desc: "Search Past Papers",
    category: "education",
    filename: __filename,
  },
  async (conn, mek, m, { q, reply }) => {
    try {
      if (!q) return reply("❌ Use: .papers science");

      const url = `https://chama-api-hub.vercel.app/api/academic/search?apikey=chama_a378377a400afa5e660c440891f73d18&q=${q}`;

      const res = await axios.get(url);

      const data = res.data?.result || [];

      if (data.length === 0) {
        return reply("❌ No results found!");
      }

      let text = `📚 *PAST PAPERS*\n🔎 Query: ${q}\n\n`;

      for (let i = 0; i < Math.min(10, data.length); i++) {
        text += `*${i + 1}.* ${data[i].title}\n`;
        text += `🔗 ${data[i].url}\n`;
        text += `🏫 ${data[i].source}\n\n`;
      }

      return reply(text);

    } catch (e) {
      console.log("ERROR:", e?.response?.data || e.message);
      reply("❌ API Error / Bot Error");
    }
  }
);
