const { cmd } = require("../command");

cmd({
  pattern: "fwd",
  desc: "Forward replied message",
  category: "owner",
  filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {

  if (!isOwner) return reply("❌ Owner only");

  if (!m.quoted) return reply("❌ Reply to a message");

  try {

    let target = m.mentionedJid?.[0] || from;

    // 🔥 IMPORTANT FIX (real Baileys object)
    await conn.copyNForward(
      target,
      m.quoted,
      true
    );

    reply("✅ Forwarded!");

  } catch (e) {
    console.log(e);
    reply("❌ Forward error: " + e.message);
  }
});
