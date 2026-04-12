const { cmd } = require("../command");

cmd({
  pattern: "getdp",
  desc: "Download WhatsApp DP",
  category: "ai",
  react: "🖼️",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  try {
    if (!args[0]) {
      return reply("❌ Number eka denna!\nExample: .getdp 947XXXXXXXX");
    }

    let number = args[0].replace(/[^0-9]/g, "");
    let jid = number + "@s.whatsapp.net";

    let pp;

    try {
      pp = await conn.profilePictureUrl(jid, "image");
    } catch {
      pp = "https://i.ibb.co/2WzKQ6w/avatar.png"; // fallback image
    }

    await conn.sendMessage(m.chat, {
      image: { url: pp },
      caption: `📸 DP of ${number}`
    }, { quoted: mek });

  } catch (err) {
    console.log(err);
    reply("❌ Error occurred");
  }

});
