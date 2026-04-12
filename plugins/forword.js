const { cmd } = require("../command");

cmd({
  pattern: "forward",
  alias: ["fwd"],
  desc: "Forward replied message to group/user",
  category: "owner",
  filename: __filename
},
async (conn, mek, m, { from, args, reply, isOwner }) => {

  if (!isOwner) return reply("❌ Owner only command");

  if (!m.quoted) return reply("❌ Reply to a message");

  if (!args[0]) return reply("❌ Give target JID\nExample:\n.forward 120363425613499610@g.us");

  try {

    let target = args[0];

    // 🔥 real forward fix
    await conn.copyNForward(
      target,
      m.quoted,
      true
    );

    reply("✅ Forwarded successfully");

  } catch (e) {
    console.log(e);
    reply("❌ Error: " + e.message);
  }
});
