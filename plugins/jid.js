const { cmd } = require("../command");

cmd({
  pattern: "jid",
  desc: "Get JID of user or group",
  react: "🆔",
  category: "utility",
  filename: __filename
},
async (conn, mek, m, { from, quoted, sender, isGroup }) => {

  try {

    // If replied message
    let target;

    if (quoted) {
      target = quoted.sender;
    } else {
      target = sender;
    }

    let chatJid = from;

    let text = `
🆔 *JID INFO*

👤 User JID:
${target}

💬 Chat JID:
${chatJid}

📌 Type:
${isGroup ? "Group" : "Private Chat"}
`;

    await conn.sendMessage(from, { text }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Error getting JID" }, { quoted: mek });
  }

});
