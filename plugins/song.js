const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    react: "🎶",
    desc: "Download Song (Stable)",
    category: "download",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Song name ekak denna");

      // 🔍 Search
      const search = await yts(q);
      const data = search.videos[0];

      if (!data) return reply("❌ Song ekak hambune na");

      const url = data.url;

      // 📝 Details
      let desc = `
🎶 *SONG DOWNLOADER*

🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
👀 *Views:* ${data.views.toLocaleString()}
🔗 *Link:* ${data.url}
`;

      await danuwa.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // ⏳ Duration limit
      let parts = data.timestamp.split(":").map(Number);
      let seconds =
        parts.length === 3
          ? parts[0] * 3600 + parts[1] * 60 + parts[2]
          : parts[0] * 60 + parts[1];

      if (seconds > 1800) {
        return reply("⏳ 30min wadi song support na");
      }

      let dl;

      // 🎯 MAIN API TRY
      try {
        const songData = await ytmp3(url, "192");

        if (!songData || !songData.download?.url) {
          throw "API error";
        }

        dl = songData.download.url;

      } catch (err) {
        console.log("Main API failed, using fallback...");

        // 🔥 FALLBACK (vevioz)
        dl = `https://api.vevioz.com/api/button/mp3/${data.videoId}`;

        return await danuwa.sendMessage(
          from,
          {
            text: `⚠️ *Main API down*\n\n⬇ Download karanna me link eka use karanna:\n${dl}`,
          },
