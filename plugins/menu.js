const { cmd } = require("../command");
const os = require("os");

cmd({
  pattern: "menu",
  desc: "Show bot menu",
  category: "main",
  react: "📜",
  filename: __filename
},
async (conn, mek, m, { from, pushName, reply }) => {

  try {

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let menuText = `
╭━━〔 🤖 *BOT MENU* 〕━━⬣
┃ 👋 Hello: ${pushName || "User"}
┃ ⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
┃ 💻 Platform: ${os.platform()}
┃ 📦 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 📥 *DOWNLOAD* 〕━━⬣
┃ .fb
┃ .apk
┃ .movie
╰━━━━━━━━━━⬣

╭━━〔 👥 *GROUP* 〕━━⬣
┃ .group open
┃ .group close
┃ .kick
┃ .add
┃ .promote
┃ .demote
┃ .tagall
┃ .ginfo
╰━━━━━━━━━━⬣

╭━━〔 ⚙️ *MAIN* 〕━━⬣
┃ .menu
┃ .ping
┃ .alive
┃ .owner
╰━━━━━━━━━━⬣

╭━━〔 🔥 *OWNER* 〕━━⬣
┃ .restart
┃ .broadcast
╰━━━━━━━━━━⬣

╰━━━〔 💥 MADE BY BOT 〕━━━⬣
`;

    await conn.sendMessage(from, {
      text: menuText,
      contextInfo: {
        externalAdReply: {
          title: "🤖 BOT MENU",
          body: "Click to explore commands",
          thumbnailUrl: "https://i.ibb.co/0jqHpnp/bot.jpg",
          sourceUrl: "https://github.com/",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Menu error!");
  }

});
