const { cmd } = require("../command");

cmd({
  pattern: "forward",
  desc: "Forward replied message to someone",
  react: "📩",
  category: "utility",
  filename: __filename
},
async (conn, mek, m, { from, quoted, args, sender }) => {

  try {

    if (!quoted) {
      return await conn.sendMessage(from, { text: "❌ Reply to a message to forward it!" }, { quoted: mek });
    }

    if (!args[0]) {
      return await conn.sendMessage(from, { text: "❌ Give target JID\nExample: .forward jid@number" }, { quoted: mek });
    }

    let target = args[0];

    await conn.copyNForward(target, quoted, true);

    await conn.sendMessage(from, { text: "✅ Message forwarded successfully!" }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Forward failed!" }, { quoted: mek });
  }

});
