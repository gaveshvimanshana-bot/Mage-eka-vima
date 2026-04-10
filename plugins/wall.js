const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "wall",
    alias: ["wallpaper"],
    react: "🖼️",
    desc: "Download HD Wallpapers",
    category: "download",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    try {

      if (!q) {
        return reply(
`╭━━〔 ❌ ERROR 〕━━╮
🖼️ Please enter a keyword

📌 Example:
.wall nature
.wall anime
╰━━━━━━━━━━━━━━╯`
        );
      }

      const introCaption =
`╭━━〔 🖼️ WALLPAPER SEARCH 〕━━╮

🔍 Keyword : ${q}
📡 Status  : Searching HD Wallpapers...

╭━━〔 🤖 VIMA-✘-MD 〕━━╮
⚡ Wallhaven API
🚀 Ultra HD Collection
╰━━━━━━━━━━━━━━━━━━━━╯
> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-✘-𝗠𝗗 𝔙1💐💙*`;

      reply("🔍 Searching HD wallpapers...");

      const res = await axios.get(
        `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q)}&sorting=random&resolutions=1920x1080,2560x1440,3840x2160`,
        {
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );

      const wallpapers = res.data.data;

      if (!wallpapers || wallpapers.length === 0) {
        return reply(
`╭━━〔 ❌ NOT FOUND 〕━━╮
🖼️ No HD wallpapers found
🔎 Try another keyword
╰━━━━━━━━━━━━━━╯`
        );
      }

      const selected = wallpapers.slice(0, 5);

      //================== INTRO IMAGE ==================
      await danuwa.sendMessage(
        from,
        {
          image: { url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png" },
          caption: introCaption,
        },
        { quoted: mek }
      );

      //================== WALLPAPERS ==================
      for (const wallpaper of selected) {

        const imageUrl =
          wallpaper.path ||
          wallpaper.file ||
          wallpaper.thumbs?.large;

        if (!imageUrl) continue;

        const caption =
`╭━━〔 🖼️ HD WALLPAPER 〕━━╮

📥 Resolution : ${wallpaper.resolution || "Unknown"}
🔗 Source     : Wallhaven
🎯 Quality    : Ultra HD

╭━━〔 🤖 *VIMA-✘-MD* 〕━━╮
⚡ Enjoy Your Wallpaper
🚀 Stay Premium
╰━━━━━━━━━━━━━━━━━━━━╯
> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-✘-𝗠𝗗 𝔙1💐💙*`;

        await danuwa.sendMessage(
          from,
          {
            image: { url: imageUrl },
            caption,
          },
          { quoted: mek }
        );
      }

      return reply(
`╭━━〔 ✅ DONE 〕━━╮

🖼️ Wallpapers Sent Successfully
🌟 Enjoy HD Collection

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ Thank you for using bot
╰━━━━━━━━━━━━━━━━━━━━╯`
      );

    } catch (e) {
      console.error(e);
      reply(
`╭━━〔 ❌ ERROR 〕━━╮
⚠️ ${e.message || e}
╰━━━━━━━━━━━━━━╯`
      );
    }
  }
);
