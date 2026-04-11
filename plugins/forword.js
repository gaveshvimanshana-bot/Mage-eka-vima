const { cmd } = require("../command");

// 👉 OWNER NUMBER (change this)
const OWNER_NUMBER = "94742838159@s.whatsapp.net";

function isOwner(sender) {
    return sender === OWNER_NUMBER;
}

cmd({
    pattern: "forward",
    alias: ["fwd"],
    desc: "Forward replied message to group",
    category: "owner",
    react: "📤",
    filename: __filename
}, async (conn, mek, m, { sender, args, quoted, reply }) => {

    // 🔐 owner check
    if (!isOwner(sender)) return reply("❌ You are not owner!");

    // 📌 target group jid
    const target = args[0];
    if (!target) {
        return reply("❌ Usage:\n.forward <groupJID>\nExample:\n.forward 120363407256800127@g.us");
    }

    // 📌 must reply message
    if (!quoted) {
        return reply("❌ Reply to a message to forward!");
    }

    try {

        // 📤 forward message
        const msg = await conn.copyNForward(target, quoted, true);

        reply("✅ Message forwarded successfully!");

    } catch (e) {
        console.log(e);
        reply("❌ Error while forwarding message!");
    }
});

module.exports = { cmd };
