const { cmd } = require("../command");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

cmd({
  pattern: "getdp",
  desc: "Get WhatsApp DP",
  category: "ai",
  react: "🖼️",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  try {
    let jid;

    if (m.quoted) {
      jid = m.quoted.sender;
    } else if (args[0]) {
      let number = args[0].replace(/[^0-9]/g, "");
      jid = jidNormalizedUser(number + "@s.whatsapp.net");
    } else {
      return reply("❌ Reply or give number");
    }

    let ppUrl;

    try {
      ppUrl = await conn.profilePictureUrl(jid, "image");
    } catch {
      return reply("❌ DP not found / private");
    }

    await conn.sendMessage(m.chat, {
      image: { url: ppUrl },
      caption: "✅ Here is DP"
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Error");
  }

});
