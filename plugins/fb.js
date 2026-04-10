const { cmd, commands } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "📥",
    desc: "Download Facebook Video",
    category: "download",
    filename: __filename,
  },
  async (
    danuwa,
    mek,
    m,
    {
      from,
      q,
      reply,
    }
  ) => {
    try {

      if (!q) return reply("❌ Please provide a Facebook video URL!");

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q)) {
        return reply("❌ Invalid Facebook URL!");
      }

      reply("📥 Downloading your video... Please wait");

      const result = await getFbVideoInfo(q);

      if (!result || (!result.sd && !result.hd)) {
        return reply("❌ Failed to fetch video. Try again later.");
      }

      const { title, sd, hd } = result;

      const bestQualityUrl = hd || sd;
      const qualityText = hd ? "HD" : "SD";

      //================== BEAUTIFUL CAPTION ==================
      const desc = `
╭━━〔 🎬 FACEBOOK DOWNLOADER 〕━━╮

👻 *Title*   : ${title || "Unknown"}
📡 *Quality* : ${qualityText}
📥 *Status*  : Ready to Download

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ Fast Facebook Downloader
🚀 Powered by NodeJS
╰━━━━━━━━━━━━━━━━━━━━╯
`;

      //================== THUMBNAIL ==================
      await danuwa.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png",
          },
          caption: desc,
        },
        { quoted: mek }
      );

      //================== VIDEO SEND ==================
      await danuwa.sendMessage(
        from,
        {
          video: { url: bestQualityUrl },
          caption: `╭━━〔 📥 VIDEO DOWNLOADED 〕━━╮
📡 Quality : ${qualityText}
🎬 Enjoy Your Video

⚡ DARK-CYBER-MD BOT
╰━━━━━━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek }
      );

      return reply("╭━━〔 ✅ DONE 〕━━╮\n📥 Video sent successfully!\n⚡ DARK-CYBER-MD\n╰━━━━━━━━━━━━━━╯");

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message || e}`);
    }
  }
);
