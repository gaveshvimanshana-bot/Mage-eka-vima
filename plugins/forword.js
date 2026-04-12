const { cmd } = require("../command");

// ==================== FORWARD MESSAGE ====================
cmd({
  pattern: "forward",
  alias: ["fwd", "sendto", "share"],
  react: "📤",
  desc: "Forward replied message to another chat/group/channel",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { isQuoted, quoted, reply, from, q }) => {
  try {
    if (!isQuoted || !quoted) {
      return reply(`📤 *Forward Message*

❌ *Reply to a message to forward!*

📌 *Usage:*
• .forward <jid> - Forward to specific chat
• .forward 120363...@g.us - Forward to group
• .forward 120363...@newsletter - Forward to channel

📌 *Examples:*
• .forward 94712345678@s.whatsapp.net
• .forward 120363423129646913@g.us
• .forward 120363405437936771@newsletter

💡 *Tip:* Get JID from .getjid command

> _Vima-MD Forwarder_`);
    }

    if (!q) {
      return reply("❌ *Provide target JID!*\n\nExample: `.forward 120363423129646913@g.us`");
    }

    const targetJid = q.trim();

    // Validate JID format
    if (!targetJid.includes('@')) {
      return reply(`❌ *Invalid JID format!*

JID should be like:
• 94712345678@s.whatsapp.net
• 120363...@g.us
• 120363...@newsletter`);
    }

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Forward the message
    await bot.sendMessage(targetJid, { forward: quoted }, { quoted: mek });

    await reply(`✅ *Message Forwarded!*

📤 *From:* ${from}
📥 *To:* ${targetJid}

> _Vima-MD Forwarder_`);

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Forward error:", err);
    reply(`❌ *Forward failed!*\n\nError: ${err.message}`);
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ==================== GET JID ====================
cmd({
  pattern: "getjid",
  alias: ["jid", "chatid", "id"],
  react: "🆔",
  desc: "Get JID of current chat/group/channel",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, isGroup }) => {
  try {
    let chatType = "Private Chat";
    if (isGroup) chatType = "Group";
    if (from.includes('@g.us')) chatType = "Group";
    if (from.includes('@newsletter')) chatType = "Channel";

    await reply(`🆔 *Chat Information*

📂 *Type:* ${chatType}
🆔 *JID:* ${from}

💡 *Use this JID with .forward command*

> _Vima-MD ID Getter_`);

  } catch (err) {
    reply("❌ *Failed to get JID!*");
  }
});

// ==================== BULK FORWARD (OWNER ONLY) ====================
cmd({
  pattern: "bulkforward",
  alias: ["massfwd", "fwdbulk"],
  react: "🚀",
  desc: "Forward message to multiple chats (Owner only)",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { isQuoted, quoted, reply, from, q, isOwner }) => {
  try {
    if (!isOwner) return reply("❌ *Owner only!*");
    if (!isQuoted || !quoted) return reply("❌ *Reply to a message!*");
    if (!q) return reply(`🚀 *Bulk Forward*

📌 *Usage:* .bulkforward <jid1,jid2,jid3>

📌 *Example:*
.bulkforward 9471...@s.whatsapp.net,120363...@g.us,120363...@newsletter`);

    const targets = q.split(',').map(j => j.trim());
    let success = 0;
    let failed = 0;

    await reply(`🚀 *Starting Bulk Forward...*\n📦 Total: ${targets.length} chats`);

    for (const target of targets) {
      try {
        if (!target.includes('@')) continue;
        
        await bot.sendMessage(target, { forward: quoted });
        success++;
        
        // Delay to avoid rate limit
        await new Promise(r => setTimeout(r, 3000));
        
      } catch (e) {
        failed++;
        console.log(`Failed to forward to ${target}:`, e.message);
      }
    }

    await reply(`✅ *Bulk Forward Complete!*

✔️ Success: ${success}
❌ Failed: ${failed}
📦 Total: ${targets.length}

> _Vima-MD Bulk Forwarder_`);

  } catch (err) {
    reply("❌ *Bulk forward failed!*");
  }
});
