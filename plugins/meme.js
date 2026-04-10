const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "meme",
    alias: ["memes"],
    react: "🤣",
    desc: "Sends a random meme from Reddit",
    category: "fun",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://meme-api.com/gimme/dankmemes");
      const { title, url, author, subreddit, ups } = res.data;

      const caption = `
😹 *${title}*
👍 ${ups} | 👤 ${author} | 🧵 r/${subreddit}
`.trim();

      await danuwa.sendMessage(
        from,
        { image: { url }, caption },
        { quoted: mek }
      );
    } catch (err) {
      console.error(err);
      reply("❌ *Failed to fetch meme. Please try again later.*");
    }
  }
);
