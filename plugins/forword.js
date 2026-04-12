const { cmd } = require("../command");

// ==================== FORWARD MESSAGE (WORKING) ====================
cmd({
  pattern: "forward",
  alias: ["fwd", "sendto", "share"],
  react: "📤",
  desc: "Forward replied message to another chat",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q }) => {
  try {
    // Check if replied to message
    if (!m.quoted) {
      return reply(`📤 *Forward Message*

❌ *Reply to a message to forward!*

📌 *Usage:* Reply to message + .forward <jid>

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

    // Get quoted message
    const quotedMsg = m.quoted;

    // Method 1: Simple forward (works for most messages)
    try {
      await bot.sendMessage(targetJid, { 
        forward: quotedMsg,
        force: true 
      });
      
      await reply(`✅ *Forwarded Successfully!*
      
📤 From: ${from}
📥 To: ${targetJid}

> _Vima-MD Forwarder_`);
      
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
      return;
      
    } catch (err1) {
      console.log("Method 1 failed:", err1.message);
    }

    // Method 2: Reconstruct message object
    try {
      const reconstructedMsg = {
        key: {
          remoteJid: quotedMsg.key?.remoteJid || from,
          fromMe: quotedMsg.key?.fromMe || false,
          id: quotedMsg.key?.id,
          participant: quotedMsg.key?.participant || undefined
        },
        message: quotedMsg.message,
        messageTimestamp: quotedMsg.messageTimestamp || Math.floor(Date.now() / 1000)
      };

      await bot.sendMessage(targetJid, { 
        forward: reconstructedMsg,
        force: true 
      });
      
      await reply(`✅ *Forwarded (Method 2)!*
      
📥 To: ${targetJid}

> _Vima-MD Forwarder_`);
      
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
      return;
      
    } catch (err2) {
      console.log("Method 2 failed:", err2.message);
    }

    // Method 3: Copy content by type (fallback)
    try {
      const msgType = Object.keys(quotedMsg.message)[0];
      const content = quotedMsg.message[msgType];

      if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
        const text = content.text || content;
        await bot.sendMessage(targetJid, { text: text });
      } 
      else if (msgType === 'imageMessage') {
        await bot.sendMessage(targetJid, { 
          image: { url: content.url },
          caption: content.caption || ''
        });
      }
      else if (msgType === 'videoMessage') {
        await bot.sendMessage(targetJid, { 
          video: { url: content.url },
          caption: content.caption || ''
        });
      }
      else if (msgType === 'documentMessage') {
        await bot.sendMessage(targetJid, { 
          document: { url: content.url },
          fileName: content.fileName || 'file',
          mimetype: content.mimetype
        });
      }
      else if (msgType === 'audioMessage') {
        await bot.sendMessage(targetJid, { 
          audio: { url: content.url },
          ptt: content.ptt || false
        });
      }
      else {
        // Last resort - try to send as text
        await bot.sendMessage(targetJid, { 
          text: `[Forwarded message - type: ${msgType}]`
        });
      }

      await reply(`✅ *Copied (Method 3)!*
      
📥 To: ${targetJid}
⚠️ Note: Forward label not shown

> _Vima-MD Forwarder_`);
      
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
      
    } catch (err3) {
      throw new Error(`All methods failed: ${err3.message}`);
    }

  } catch (err) {
    console.error("Forward error:", err);
    reply(`❌ *Forward Failed!*

Error: ${err.message}

💡 *Tips:*
• Make sure target JID is correct
• Bot must be in target group (for groups)
• For channels, bot must be admin
• Try .copy command as alternative`);
    
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
}, async (bot, mek, m, { reply, from }) => {
  try {
    let chatType = "Private Chat";
    if (from.endsWith('@g.us')) chatType = "Group";
    else if (from.endsWith('@newsletter')) chatType = "Channel";

    await reply(`🆔 *Chat Information*

📂 *Type:* ${chatType}
🆔 *JID:* ${from}

💡 *Use this JID with .forward command*

> _Vima-MD ID Getter_`);

  } catch (err) {
    reply("❌ *Failed to get JID!*");
  }
});

// ==================== COPY (Alternative) ====================
cmd({
  pattern: "copy",
  alias: ["cpy", "duplicate"],
  react: "📋",
  desc: "Copy message without forward label",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q }) => {
  try {
    if (!m.quoted) return reply("❌ *Reply to a message!*");
    if (!q) return reply("❌ *Provide target JID!*");

    const targetJid = q.trim();
    const quotedMsg = m.quoted;
    const msgType = Object.keys(quotedMsg.message)[0];
    const content = quotedMsg.message[msgType];

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Send based on type
    if (msgType === 'conversation') {
      await bot.sendMessage(targetJid, { text: content });
    } 
    else if (msgType === 'extendedTextMessage') {
      await bot.sendMessage(targetJid, { text: content.text });
    }
    else if (msgType === 'imageMessage') {
      await bot.sendMessage(targetJid, { 
        image: { url: content.url },
        caption: content.caption || ''
      });
    }
    else if (msgType === 'videoMessage') {
      await bot.sendMessage(targetJid, { 
        video: { url: content.url },
        caption: content.caption || ''
      });
    }
    else if (msgType === 'documentMessage') {
      await bot.sendMessage(targetJid, { 
        document: { url: content.url },
        fileName: content.fileName || 'file',
        mimetype: content.mimetype
      });
    }
    else if (msgType === 'audioMessage') {
      await bot.sendMessage(targetJid, { 
        audio: { url: content.url },
        ptt: content.ptt || false
      });
    }
    else if (msgType === 'stickerMessage') {
      await bot.sendMessage(targetJid, { 
        sticker: { url: content.url }
      });
    }
    else {
      await bot.sendMessage(targetJid, { 
        text: `[${msgType} message]`
      });
    }

    await reply(`✅ *Copied!*
    
📋 To: ${targetJid}
📄 Type: ${msgType}

> _Vima-MD Copier_`);
    
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Copy error:", err);
    reply("❌ *Copy failed!*");
  }
});
