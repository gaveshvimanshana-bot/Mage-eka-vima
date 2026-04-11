const { cmd } = require("../command");

cmd(
  {
    on: "body",
  },
  async (conn, mek, m, { from, body, isGroup, sender, isBotAdmin, isAdmin }) => {

    if (!isGroup) return;
    if (!isBotAdmin) return; // bot admin නැත්තම් delete කරන්න බෑ
    if (isAdmin) return; // admins ignore කරන්න ඕන නම්

    // 🔗 link detect
    const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|wa\.me\/)/gi;

    if (linkRegex.test(body)) {
      try {

        // delete message (Baileys safe key usage)
        await conn.sendMessage(from, {
          delete: mek.key || m.key,
        });

        // warning message
        await conn.sendMessage(from, {
          text: `🚫 *Links not allowed in this group!*\n👤 @${sender.split("@")[0]}`,
          mentions: [sender],
        });

      } catch (err) {
        console.log("Anti-link delete error:", err);
      }
    }
  }
);
