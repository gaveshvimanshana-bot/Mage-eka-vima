const { cmd } = require("../command");

// Tag All
cmd({
  pattern: "tagall",
  desc: "Tag all group members",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, participants, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  
  let teks = `📢 *Message:*\n\n`;
  for (let mem of participants) {
    teks += `✦ @${mem.id.split('@')[0]}\n`;
  }
  bot.sendMessage(m.chat, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });
});

// Promote
cmd({
  pattern: "promote",
  desc: "Promote member to admin",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  if (!isBotAdmins) return reply("❌ Bot must be admin!");
  
  let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
  if (!users) return reply("❌ Tag someone!");
  
  await bot.groupParticipantsUpdate(m.chat, [users], "promote");
  reply(`✅ Promoted @${users.split('@')[0]}`, { mentions: [users] });
});

// Demote  
cmd({
  pattern: "demote",
  desc: "Demote admin to member",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  if (!isBotAdmins) return reply("❌ Bot must be admin!");
  
  let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
  if (!users) return reply("❌ Tag someone!");
  
  await bot.groupParticipantsUpdate(m.chat, [users], "demote");
  reply(`✅ Demoted @${users.split('@')[0]}`, { mentions: [users] });
});

// Kick
cmd({
  pattern: "kick",
  desc: "Remove member from group",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  if (!isBotAdmins) return reply("❌ Bot must be admin!");
  
  let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
  if (!users) return reply("❌ Tag someone!");
  
  await bot.groupParticipantsUpdate(m.chat, [users], "remove");
  reply(`✅ Kicked @${users.split('@')[0]}`, { mentions: [users] });
});

// Mute Group
cmd({
  pattern: "mute",
  desc: "Mute group (admin only messages)",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  if (!isBotAdmins) return reply("❌ Bot must be admin!");
  
  await bot.groupSettingUpdate(m.chat, "announcement");
  reply("🔇 Group muted! Only admins can send messages.");
});

// Unmute Group
cmd({
  pattern: "unmute",
  desc: "Unmute group",
  category: "group",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only!");
  if (!isAdmins) return reply("❌ Admin only!");
  if (!isBotAdmins) return reply("❌ Bot must be admin!");
  
  await bot.groupSettingUpdate(m.chat, "not_announcement");
  reply("🔊 Group unmuted! Everyone can send messages.");
});

// Anti-Link
cmd({
  on: "body",
}, async (bot, mek, m, { isGroup, isAdmins, isBotAdmins, body, reply }) => {
  if (!isGroup) return;
  if (isAdmins) return; // Ignore admins
  
  const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
  if (linkRegex.test(body)) {
    if (!isBotAdmins) return;
    
    await bot.sendMessage(m.chat, { delete: mek.key });
    await bot.groupParticipantsUpdate(m.chat, [m.sender], "remove");
    reply(`🚫 @${m.sender.split('@')[0]} removed for sending links!`, { mentions: [m.sender] });
  }
});
