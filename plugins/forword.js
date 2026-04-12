const { cmd } = require("../command");

// ==================== FORWARD MESSAGE (WORKING) ====================
cmd({
  pattern: "forward",
  alias: ["fwd", "sendto", "share"],
  react: "📤",
  desc: "Forward replied message to another chat",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q, sender }) => {
  try {
    // IMPORTANT: Check m.quoted (not isQuoted)
    if (!m.quoted) {
      return reply(`📤 *Forward Message*

❌ *Reply to a message to forward!*

📌 *Usage:* Reply to message + .forward <jid>

📌 *Examples:*
• Reply + .forward 120363423129646913@g.us
• Reply + .forward 120363405437936771@newsletter

💡 *Get JID:* Use .getjid command

> _Vima-MD Forwarder_`);
    }

    if (!q) {
      return reply("❌ *Provide target JID!*\n\nExample: .forward 120363423129646913@g.us");
    }

    const targetJid = q.trim();

    if (!targetJid.includes('@')) {
      return reply(`❌ *Invalid JID!*

Format:
• 94712345678@s.whatsapp.net
• 120363...@g.us
• 120363...@newsletter`);
    }

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Get the quoted message
    const quotedMsg = m.quoted;

    // Log for debugging
    console.log("Quoted message structure:", JSON.stringify(quotedMsg.key, null, 2));

    // Method 1: Direct forward (works with complete message object)
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
      console.log("Direct forward failed:", err1.message);
    }

    // Method 2: Reconstruct message with required fields
    try {
      const forwardMsg = {
        key: {
          remoteJid: quotedMsg.key?.remoteJid || from,
          fromMe: quotedMsg.key?.fromMe || false,
          id: quotedMsg.key?.id,
          participant: quotedMsg.key?.participant || undefined
        },
        message: quotedMsg.message,
        messageTimestamp: quotedMsg.messageTimestamp || Math.floor(Date.now() / 1000),
        pushName: quotedMsg.pushName || undefined
      };

      await bot.sendMessage(targetJid, { 
        forward: forwardMsg,
        force: true 
      });
      
      await reply(`✅ *Forwarded (Method 2)!*
      
📥 To: ${targetJid}

> _Vima-MD Forwarder_`);
      
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
      return;
      
    } catch (err2) {
      console.log("Reconstructed forward failed:", err2.message);
    }

    // Method 3: Copy content (no forward label)
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
        await bot.sendMessage(targetJid, { 
          text: `[Forwarded ${msgType}]`
        });
      }

      await reply(`✅ *Copied (no forward label)!*
      
📥 To: ${targetJid}

> _Vima-MD Copier_`);
      
      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
      
    } catch (err3) {
      throw new Error(`All methods failed: ${err3.message}`);
    }

  } catch (err) {
    console.error("Forward error:", err);
    reply(`❌ *Forward Failed!*

Error: ${err.message}

💡 Check:
• Target JID is correct
• Bot is in target group
• For channels, bot must be admin`);
    
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ==================== GET JID ====================
cmd({
  pattern: "getjid",
  alias: ["jid", "chatid"],
  react: "🆔",
  desc: "Get JID of current chat",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  try {
    let chatType = "Private";
    if (from.endsWith('@g.us')) chatType = "Group";
    else if (from.endsWith('@newsletter')) chatType = "Channel";

    await reply(`🆔 *Chat Information*

📂 *Type:* ${chatType}
🆔 *JID:* \`${from}\`

💡 Use with .forward command

> _Vima-MD_`);

  } catch (err) {
    reply("❌ *Failed!*");
  }
});
