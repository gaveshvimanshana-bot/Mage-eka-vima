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
      if (!q) return reply("*🖼️ Please enter a keyword to search HD wallpapers!*");

      reply("*🔍 Searching for HD wallpapers... Please wait a moment.*");

      const res = await axios.get(
        `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q)}&sorting=random&resolutions=1920x1080,2560x1440,3840x2160`,
        {
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );

      const wallpapers = res.data.data;
      if (!wallpapers || wallpapers.length === 0) {
        return reply("*❌ No HD wallpapers found for that keyword.*");
      }

      const selected = wallpapers.slice(0, 5); // top 5

      // Send intro image
      await danuwa.sendMessage(
        from,
        {
          image: { url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png" },
          caption: "ＶＩＭＡ ＭＤ ✘ WALLPAPER DOWNLOADER",
        },
        { quoted: mek }
      );

      for (const wallpaper of selected) {
        // Wallhaven API image URL fix
        const imageUrl = wallpaper.path || wallpaper.file || wallpaper.thumbs?.large;
        if (!imageUrl) continue;

        const caption = `
📥 *Resolution:* ${wallpaper.resolution || "Unknown"}
🔗 *Link:* ${wallpaper.url || "https://wallhaven.cc/w/" + wallpaper.id}
        `;

        await danuwa.sendMessage(
          from,
          {
            image: { url: imageUrl },
            caption,
          },
          { quoted: mek }
        );
      }

      return reply("*🌟 Enjoy your HD wallpapers! Thank you for using VIMA-MD.*");
    } catch (e) {
      console.error(e);
      reply(`*❌ Error:* ${e.message || e}`);
    }
  }
);
