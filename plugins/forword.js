const { cmd } = require("../command");

const OWNER_NUMBER = "94742838159@s.whatsapp.net";

function isOwner(sender) {
    return sender === OWNER_NUMBER;
}

cmd({
    pattern: "forward",
    alias: ["fwd"],
    desc: "Forward replied message to group (fixed)",
    category: "ai",
    react: "📤",
    filename: __filename
}, async (conn, mek, m, { sender, args, quoted, reply }) => {

    if (!isOwner(sender)) return reply("❌ You are not owner!");

    const target = args[0];
    if (!target) {
        return reply("❌ Usage:\n.forward <groupJID>\nExample:\n.forward 120363407256800127@g.us");
    }

    if (!quoted) return reply("❌ Reply to a message first!");

    try {

        // 🔥 IMPORTANT FIX: always get raw message
        const msg = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!msg) return reply("❌ Can't find quoted message!");

        // ✅ proper forward
        await conn.relayMessage(
            target,
            msg,
            { messageId: quoted.key?.id }
        );

        reply("✅ Forwarded successfully!");

    } catch (err) {
        console.log(err);
        reply("❌ Forward failed! Check console.");
    }
});

module.exports = { cmd };
