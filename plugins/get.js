const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "getdp",
  desc: "Get DP using API",
  category: "ai",
  react: "🖼️",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  try {
    if (!args[0]) {
      return reply("❌ Number ekak denna\nExample: .getdp 947XXXXXXXX");
    }

    let number = args[0].replace(/[^0-9]/g, "");

    // 🔥 API URL (sample free API)
    let api = `https://api.popcat.xyz/whatsappdp?number=${number}`;

    let res = await axios.get(api);

    if (!res.data || !res.data.dp) {
      return reply("❌ DP not found!");
    }

    let dp = res.data.dp;

    await conn.sendMessage(m.chat, {
      image: { url: dp },
      caption: `✅ API DP of ${number}`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ API Error");
  }

});
