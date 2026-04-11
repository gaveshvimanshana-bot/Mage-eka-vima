const { cmd } = require("../command");

// Helper function to get user from mention or quoted
const getTargetUser = (m) => {
  // Check mentioned users
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    return m.mentionedJid[0];
  }
  // Check quoted message
  if (m.quoted && m.quoted.sender) {
    return m.quoted.sender;
  }
  // Check if message is reply to someone
  if (m.message?.extendedTextMessage?.contextInfo?.participant) {
    return m.message.extendedTextMessage.contextInfo.participant;
  }
  return null;
};

// Helper to check if bot is admin
const isBotAdmin = async (bot, chatId) => {
  try {
    const groupMetadata = await bot.groupMetadata(chatId);
    const botId = bot.user.id.split(':')[0] + '@s.whatsapp.net';
    return groupMetadata.participants.some(p => p.id === botId && p.admin !== null);
  } catch {
    return false;
  }
};

// ==================== TAG ALL ====================
cmd({
  pattern: "tagall",
  alias: ["tag", "all"],
  react: "📢",
  desc: "Tag all group members",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *This command only works in groups!*");
    if (!isAdmins) return reply("❌ *Only admins can use this command!*");

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Get fresh group metadata
    const groupMetadata = await bot.groupMetadata(from);
    const participants = groupMetadata.participants;

    if (!participants || participants.length === 0) {
      return reply("❌ *Could not get group members!*");
    }

    let teks = `📢 *Attention Everyone!*\n\n`;
    teks += `👤 *Total Members:* ${participants.length}\n`;
    teks += `📝 *Message:* ${m.text.split(' ').slice(1).join(' ') || 'No message'}\n\n`;
    teks += `╭─────────────────◆\n`;

    // Build mentions array properly
    const mentions = [];
    for (let mem of participants) {
      const id = mem.id.split('@')[0];
      teks += `│ ✦ @${id}\n`;
      mentions.push(mem.id);
    }
    teks += `╰─────────────────◆\n\n`;
    teks += `> _Powered by Vima-MD_`;

    await bot.sendMessage(from, { 
      text: teks, 
      mentions: mentions 
    }, { quoted: mek });

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Tagall Error:", err);
    reply("❌ *Failed to tag all members!*");
  }
});

// ==================== TAG ADMINS ====================
cmd({
  pattern: "tagadmins",
  alias: ["admins", "admin"],
  react: "👑",
  desc: "Tag all admins only",
  category: "group",
}, async (bot, mek, m, { isGroup, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const groupMetadata = await bot.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null);

    if (admins.length === 0) return reply("❌ *No admins found!*");

    let teks = `👑 *Calling All Admins!*\n\n`;
    const mentions = [];

    for (let admin of admins) {
      teks += `▸ @${admin.id.split('@')[0]}\n`;
      mentions.push(admin.id);
    }

    teks += `\n> _Vima-MD Admin Call_`;

    await bot.sendMessage(from, { text: teks, mentions }, { quoted: mek });
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Tagadmins Error:", err);
    reply("❌ *Failed to tag admins!*");
  }
});

// ==================== PROMOTE ====================
cmd({
  pattern: "promote",
  alias: ["admin", "makeadmin"],
  react: "⬆️",
  desc: "Promote member to admin",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    // Check if bot is admin
    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    const user = getTargetUser(m);
    if (!user) return reply("❌ *Tag someone or reply to their message!*\n\nExample: `.promote @user`");

    // Check if already admin
    const groupMetadata = await bot.groupMetadata(from);
    const participant = groupMetadata.participants.find(p => p.id === user);
    
    if (participant && participant.admin !== null) {
      return reply("❌ *User is already an admin!*");
    }

    await bot.groupParticipantsUpdate(from, [user], "promote");
    
    await reply(`⬆️ *Promoted to Admin*\n\n👤 User: @${user.split('@')[0]}\n✅ Status: Admin\n\n> _By Vima-MD_`, { 
      mentions: [user] 
    });
    
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Promote Error:", err);
    reply("❌ *Failed to promote! Make sure bot is admin.*");
  }
});

// ==================== DEMOTE ====================
cmd({
  pattern: "demote",
  alias: ["removeadmin", "unadmin"],
  react: "⬇️",
  desc: "Demote admin to member",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    const user = getTargetUser(m);
    if (!user) return reply("❌ *Tag someone or reply to their message!*");

    // Check if user is admin
    const groupMetadata = await bot.groupMetadata(from);
    const participant = groupMetadata.participants.find(p => p.id === user);
    
    if (!participant || participant.admin === null) {
      return reply("❌ *User is not an admin!*");
    }

    // Prevent demoting owner
    if (participant.admin === 'superadmin') {
      return reply("❌ *Cannot demote group owner!*");
    }

    await bot.groupParticipantsUpdate(from, [user], "demote");
    
    await reply(`⬇️ *Demoted to Member*\n\n👤 User: @${user.split('@')[0]}\n❌ Status: Member\n\n> _By Vima-MD_`, { 
      mentions: [user] 
    });
    
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Demote Error:", err);
    reply("❌ *Failed to demote!*");
  }
});

// ==================== KICK / REMOVE ====================
cmd({
  pattern: "kick",
  alias: ["remove", "ban", "bye"],
  react: "🚫",
  desc: "Remove member from group",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from, sender }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    const user = getTargetUser(m);
    if (!user) return reply("❌ *Tag someone or reply to their message!*\n\nExample: `.kick @user`");

    // Prevent self-kick
    if (user === sender) return reply("❌ *You cannot kick yourself!*");

    // Check if trying to kick admin
    const groupMetadata = await bot.groupMetadata(from);
    const participant = groupMetadata.participants.find(p => p.id === user);
    
    if (participant && participant.admin !== null) {
      return reply("❌ *Cannot kick an admin! Demote first.*");
    }

    await bot.groupParticipantsUpdate(from, [user], "remove");
    
    await reply(`🚫 *User Removed*\n\n👤 Kicked: @${user.split('@')[0]}\n🛡️ By: Admin\n\n> _Vima-MD Protection_`, { 
      mentions: [user] 
    });
    
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Kick Error:", err);
    reply("❌ *Failed to kick user!*");
  }
});

// ==================== ADD MEMBER ====================
cmd({
  pattern: "add",
  alias: ["invite", "new"],
  react: "➕",
  desc: "Add member to group",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from, q }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    if (!q) return reply("❌ *Provide phone number!*\n\nExample: `.add 94712345678`");

    // Clean number
    let number = q.replace(/[^0-9]/g, '');
    if (!number.startsWith('94')) {
      return reply("❌ *Please use format: 94712345678 (with country code)*");
    }

    const userJid = `${number}@s.whatsapp.net`;

    await bot.groupParticipantsUpdate(from, [userJid], "add");
    
    await reply(`➕ *Added to Group*\n\n👤 Number: ${number}\n✅ Status: Added\n\n> _By Vima-MD_`);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Add Error:", err);
    if (err.data === 409) {
      reply("❌ *User is already in the group!*");
    } else if (err.data === 403) {
      reply("❌ *User's privacy settings prevent adding!*");
    } else {
      reply("❌ *Failed to add user! Check number and try again.*");
    }
  }
});

// ==================== MUTE GROUP ====================
cmd({
  pattern: "mute",
  alias: ["close", "lock"],
  react: "🔇",
  desc: "Mute group (admins only)",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    await bot.groupSettingUpdate(from, "announcement");
    
    await reply(`🔇 *Group Muted*\n\n✅ Only admins can send messages now!\n\n> _Locked by Vima-MD_`);
    await bot.sendMessage(from, { react: { text: "🔇", key: mek.key } });

  } catch (err) {
    console.error("Mute Error:", err);
    reply("❌ *Failed to mute group!*");
  }
});

// ==================== UNMUTE GROUP ====================
cmd({
  pattern: "unmute",
  alias: ["open", "unlock"],
  react: "🔊",
  desc: "Unmute group (everyone can chat)",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return reply("❌ *Bot must be admin!*");

    await bot.groupSettingUpdate(from, "not_announcement");
    
    await reply(`🔊 *Group Unmuted*\n\n✅ Everyone can send messages now!\n\n> _Unlocked by Vima-MD_`);
    await bot.sendMessage(from, { react: { text: "🔊", key: mek.key } });

  } catch (err) {
    console.error("Unmute Error:", err);
    reply("❌ *Failed to unmute group!*");
  }
});

// ==================== GROUP INFO ====================
cmd({
  pattern: "groupinfo",
  alias: ["ginfo", "group"],
  react: "📊",
  desc: "Show group information",
  category: "group",
}, async (bot, mek, m, { isGroup, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");

    const metadata = await bot.groupMetadata(from);
    const admins = metadata.participants.filter(p => p.admin !== null);
    const isLocked = metadata.announce === true;

    let info = `╭━━━〔 📊 *GROUP INFO* 〕━━━┈⊷\n`;
    info += `┃\n`;
    info += `┃ 📛 *Name:* ${metadata.subject}\n`;
    info += `┃ 📝 *Description:* ${metadata.desc || "No description"}\n`;
    info += `┃ 👥 *Members:* ${metadata.participants.length}\n`;
    info += `┃ 👑 *Admins:* ${admins.length}\n`;
    info += `┃ 🔗 *Group ID:* ${metadata.id}\n`;
    info += `┃ 🔒 *Status:* ${isLocked ? "🔇 Muted" : "🔊 Open"}\n`;
    info += `┃ 📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n`;
    info += `┃\n`;
    info += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;
    info += `> _Vima-MD Group Info_`;

    await reply(info);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Groupinfo Error:", err);
    reply("❌ *Failed to get group info!*");
  }
});

// ==================== ANTI-LINK (FIXED) ====================
// This uses message handler instead of cmd
cmd({
  on: "text",  // Changed from "body" to "text"
}, async (bot, mek, m, { isGroup, isAdmins, from, body, sender }) => {
  try {
    // Only work in groups
    if (!isGroup) return;
    
    // Ignore admins
    if (isAdmins) return;

    // Check if bot is admin
    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return; // Silently return if bot not admin

    // Link detection regex
    const linkRegex = /(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}|wa\.me\/[0-9]+|whatsapp\.com)/i;
    
    if (linkRegex.test(body)) {
      // Delete message
      await bot.sendMessage(from, { delete: mek.key });
      
      // Warn or kick
      await bot.sendMessage(from, {
        text: `🚫 *Link Detected!*\n\n@${sender.split('@')[0]} sent a forbidden link!\n⚠️ This is your warning. Next time = KICK!`,
        mentions: [sender]
      });
      
      // Optional: Kick immediately (uncomment to enable)
      // await bot.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (err) {
    console.error("Anti-link Error:", err);
    // Silent fail - don't spam group with errors
  }
});

// ==================== ANTI-BAD WORDS ====================
cmd({
  on: "text",
}, async (bot, mek, m, { isGroup, isAdmins, from, body, sender }) => {
  try {
    if (!isGroup) return;
    if (isAdmins) return;

    const botIsAdmin = await isBotAdmin(bot, from);
    if (!botIsAdmin) return;

    // Bad words list (customize as needed)
    const badWords = ['පක', 'හුත්', 'කැරිය', 'fuck', 'shit', 'bitch'];
    const lowerBody = body.toLowerCase();

    const hasBadWord = badWords.some(word => lowerBody.includes(word));
    
    if (hasBadWord) {
      await bot.sendMessage(from, { delete: mek.key });
      
      await bot.sendMessage(from, {
        text: `🚫 *Bad Word Detected!*\n\n@${sender.split('@')[0]} watch your language!\n⚠️ Warning issued.`,
        mentions: [sender]
      });
    }
  } catch (err) {
    console.error("Anti-badword Error:", err);
  }
});
