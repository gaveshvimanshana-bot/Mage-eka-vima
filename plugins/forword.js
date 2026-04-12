const { cmd } = require("../command");

// ==================== FORWARD MESSAGE (FIXED) ====================
cmd({
  pattern: "forward",
  alias: ["fwd", "sendto", "share"],
  react: "📤",
  desc: "Forward replied message to another chat/group/channel",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q, isQuoted }) => {
  try {
    // Check if replied to message
    if (!m.quoted && !isQuoted) {
      return reply(`📤 *Forward Message*

❌ *Reply to a message to forward!*

📌 *Usage:*
• Reply to message + .forward <jid>

📌 *Examples:*
• Reply + .forward 120363423129646913@g.us
• Reply + .forward 120363405437936771@newsletter
• Reply + .forward 94712345678@s.whatsapp.net

💡 *Get JID:* Use .getjid command

> _Vima-MD Forwarder_`);
    }

    if (!q) {
      return reply("❌ *Provide target JID!*\n\nExample: .forward 120363423129646913@g.us");
    }

    const targetJid = q.trim();

    // Validate JID
    if (!targetJid.includes('@')) {
      return reply(`❌ *Invalid JID!*

Format should be:
• 94712345678@s.whatsapp.net (Private)
• 120363...@g.us (Group)
• 120363...@newsletter (Channel)`);
    }

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Get the quoted message properly
    const quotedMsg = m.quoted;
    
    // Create proper message object for forward
    const msgToForward = {
      key: {
        remoteJid: quotedMsg.key.remoteJid || from,
        fromMe: quotedMsg.key.fromMe || false,
        id: quotedMsg.key.id,
        participant: quotedMsg.key.participant || undefined
      },
      message: quotedMsg.message,
      messageTimestamp: quotedMsg.messageTimestamp || Math.floor(Date.now() / 1000)
    };

    // Forward using Baileys native forward
    await bot.sendMessage(targetJid, { 
      forward: msgToForward,
      force: true 
    });

    await reply(`✅ *Forwarded Successfully!*

📤 From: ${from}
📥 To: ${targetJid}
🆔 Message ID: ${quotedMsg.key.id}

> _Vima-MD Forwarder_`);

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Forward error:", err);
    
    // Try alternative method
    try {
      if (m.quoted) {
        // Method 2: Copy message content directly
        const quotedMsg = m.quoted;
        const msgType = Object.keys(quotedMsg.message)[0];
        const content = quotedMsg.message[msgType];
        
        // Send based on type
        if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
          const text = content.text || content;
          await bot.sendMessage(targetJid, { text: text });
        } else if (msgType === 'imageMessage') {
          await bot.sendMessage(targetJid, { 
            image: content, 
            caption: content.caption || '' 
          });
        } else if (msgType === 'videoMessage') {
          await bot.sendMessage(targetJid, { 
            video: content, 
            caption: content.caption || '' 
          });
        } else if (msgType === 'documentMessage') {
          await bot.sendMessage(targetJid, { 
            document: content, 
            fileName: content.fileName || 'file',
            mimetype: content.mimetype 
          });
        } else if (msgType === 'audioMessage') {
          await bot.sendMessage(targetJid, { 
            audio: content, 
            ptt: content.ptt || false 
          });
        } else {
          // Generic forward for other types
          await bot.sendMessage(targetJid, { forward: m.quoted });
        }
        
        await reply(`✅ *Forwarded (Alternative Method)!*\n\n📥 To: ${targetJid}`);
        await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return;
      }
    } catch (err2) {
      console.error("Alternative forward also failed:", err2);
    }
    
    reply(`❌ *Forward Failed!*

Error: ${err.message}

💡 *Try:*
• Check if target JID is correct
• Make sure bot is in target group
• For channels, bot must be admin`);
    
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ==================== GET JID ====================
cmd({
  pattern: "getjid",
  alias: ["jid", "chatid", "id"],
  react: "🆔",
  desc: "Get JID of current chat",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, isGroup, pushname }) => {
  try {
    let chatType = "Private Chat";
    if (from.endsWith('@g.us')) chatType = "Group";
    else if (from.endsWith('@newsletter')) chatType = "Channel";
    else if (from.endsWith('@broadcast')) chatType = "Broadcast";

    await reply(`🆔 *Chat Information*

👤 *Name:* ${pushname || 'Unknown'}
📂 *Type:* ${chatType}
🆔 *JID:* \`${from}\`

💡 *Use this JID with .forward command*

> _Vima-MD ID Getter_`);

  } catch (err) {
    reply("❌ *Failed to get JID!*");
  }
});

// ==================== COPY MESSAGE (Alternative) ====================
cmd({
  pattern: "copy",
  alias: ["copymsg", "duplicate"],
  react: "📋",
  desc: "Copy message content (text/media) without forward label",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q, isQuoted }) => {
  try {
    if (!m.quoted && !isQuoted) {
      return reply("❌ *Reply to a message to copy!*");
    }

    if (!q) return reply("❌ *Provide target JID!*");

    const targetJid = q.trim();
    const quotedMsg = m.quoted;
    
    // Get message type and content
    const msgType = Object.keys(quotedMsg.message)[0];
    const content = quotedMsg.message[msgType];

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Send based on type (no forward label)
    if (msgType === 'conversation') {
      await bot.sendMessage(targetJid, { text: content });
    } else if (msgType === 'extendedTextMessage') {
      await bot.sendMessage(targetJid, { text: content.text });
    } else if (msgType === 'imageMessage') {
      await bot.sendMessage(targetJid, { 
        image: { url: content.url || content },
        caption: content.caption || ''
      });
    } else if (msgType === 'videoMessage') {
      await bot.sendMessage(targetJid, { 
        video: { url: content.url || content },
        caption: content.caption || ''
      });
    } else if (msgType === 'documentMessage') {
      await bot.sendMessage(targetJid, { 
        document: { url: content.url || content },
        fileName: content.fileName || 'file',
        mimetype: content.mimetype
      });
    } else if (msgType === 'audioMessage') {
      await bot.sendMessage(targetJid, { 
        audio: { url: content.url || content },
        ptt: content.ptt || false
      });
    } else if (msgType === 'stickerMessage') {
      await bot.sendMessage(targetJid, { 
        sticker: { url: content.url || content }
      });
    } else {
      // Fallback
      await bot.sendMessage(targetJid, { text: `[Unsupported message type: ${msgType}]` });
    }

    await reply(`✅ *Message Copied!*

📋 Copied to: ${targetJid}
📄 Type: ${msgType}

> _Vima-MD Copier_`);
    
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Copy error:", err);
    reply("❌ *Copy failed!*");
  }
});
