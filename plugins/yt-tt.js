const { cmd } = require("../command");
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");


//================== YOUTUBE SEARCH ==================
async function getYoutube(query) {
  const isUrl = /(youtube\.com|youtu\.be)/i.test(query);

  if (isUrl) {
    const id = query.split("v=")[1] || query.split("/").pop();
    const info = await yts({ videoId: id });
    return info;
  }

  const search = await yts(query);
  if (!search.videos.length) return null;
  return search.videos[0];
}


//================== YTMP3 ==================
cmd({
  pattern: "ytmp3",
  alias: ["yta", "song"],
  desc: "Download YouTube MP3",
  category: "download",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  try {

    if (!q) return reply("🎵 Send song name or YouTube link");

    reply("🔎 Searching YouTube...");

    const video = await getYoutube(q);
    if (!video) return reply("❌ No results found");

    const caption =
`╭━━〔 🎵 YOUTUBE MP3 〕━━╮

🎧 Title   : ${video.title}
👤 Channel : ${video.author.name}
⏱ Duration: ${video.timestamp}
👀 Views   : ${video.views.toLocaleString()}

🔗 Link : ${video.url}

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ High Quality Audio
🚀 Fast Download System
╰━━━━━━━━━━━━━━━━━━━━╯
> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗛𝗔𝗦𝗛𝗔𝗡-𝗠𝗗 𝗩𝗘𝗥𝗦𝗜𝗢𝗡 1 💐💙*`;

    await bot.sendMessage(
      from,
      {
        image: { url: video.thumbnail },
        caption,
      },
      { quoted: mek }
    );

    reply("⬇️ Downloading MP3...");

    const data = await ytmp3(video.url);
    if (!data?.url) return reply("❌ Failed to download MP3");

    await bot.sendMessage(
      from,
      {
        audio: { url: data.url },
        mimetype: "audio/mpeg",
      },
      { quoted: mek }
    );

  } catch (e) {
    console.log("YTMP3 ERROR:", e);
    reply("❌ Error while downloading MP3");
  }
});


//================== YTMP4 ==================
cmd({
  pattern: "ytmp4",
  alias: ["ytv", "video"],
  desc: "Download YouTube MP4",
  category: "download",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  try {

    if (!q) return reply("🎬 Send video name or YouTube link");

    reply("🔎 Searching YouTube...");

    const video = await getYoutube(q);
    if (!video) return reply("❌ No results found");

    const caption =
`╭━━〔 🎬 YOUTUBE VIDEO 〕━━╮

🎬 Title   : ${video.title}
👤 Channel : ${video.author.name}
⏱ Duration: ${video.timestamp}
👀 Views   : ${video.views.toLocaleString()}
📅 Upload  : ${video.ago}

🔗 Link : ${video.url}

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ 720p Video Download
🚀 Fast System
╰━━━━━━━━━━━━━━━━━━━━╯`;

    await bot.sendMessage(
      from,
      {
        image: { url: video.thumbnail },
        caption,
      },
      { quoted: mek }
    );

    reply("⬇️ Downloading video...");

    const data = await ytmp4(video.url, {
      format: "mp4",
      videoQuality: "720",
    });

    if (!data?.url) return reply("❌ Failed to download video");

    await bot.sendMessage(
      from,
      {
        video: { url: data.url },
        mimetype: "video/mp4",
        fileName: data.filename || "youtube_video.mp4",
        caption: `╭━━〔 📥 DOWNLOADED 〕━━╮
🎬 ${video.title}
⚡ DARK-CYBER-MD
╰━━━━━━━━━━━━━━━━━━━━╯`,
      },
      { quoted: mek }
    );

  } catch (e) {
    console.log("YTMP4 ERROR:", e);
    reply("❌ Error while downloading video");
  }
});


//================== TIKTOK ==================
cmd({
  pattern: "tiktok",
  alias: ["tt"],
  desc: "Download TikTok video",
  category: "download",
  filename: __filename,
}, async (bot, mek, m, { from, q, reply }) => {
  try {

    if (!q) return reply("📱 Send TikTok link");

    reply("⬇️ Downloading TikTok video...");

    const data = await tiktok(q);
    if (!data?.no_watermark) return reply("❌ Failed to download TikTok video");

    const caption =
`╭━━〔 📱 TIKTOK VIDEO 〕━━╮

🎵 Title   : ${data.title || "TikTok Video"}
👤 Author  : ${data.author || "Unknown"}
⏱ Duration: ${data.runtime}s

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ No Watermark Video
🚀 Fast Downloader
╰━━━━━━━━━━━━━━━━━━━━╯`;

    await bot.sendMessage(
      from,
      {
        video: { url: data.no_watermark },
        caption,
      },
      { quoted: mek }
    );

  } catch (e) {
    console.log("TIKTOK ERROR:", e);
    reply("❌ Error while downloading TikTok video");
  }
});
