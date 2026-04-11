const { cmd } = require("../command");
const { getGroupAdmins } = require("../lib/functions");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

// ================= BOT ADMIN CHECK =================
function isBotAdminCheck(participants, botId) {
  return participants.some(
    (p) => p.id === botId && p.admin
  );
}

// ================= TARGET USER =================
function getTargetUser(mek, quoted, args) {
  if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
  } else if (quoted?.sender) {
    return quoted.sender;
  } else if (args[0]?.includes("@")) {
    return args[0].replace("@", "") + "@s.whatsapp.net";
  }
  return null;
}

// ================= KICK =================
cmd({
  pattern: "kick",
  react: "👢",
  desc: "Kick user from group",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants, quoted, args }) => {

  const botId = danuwa.user.id.split(":")[0] + "@s.whatsapp.net";

  if (!isGroup || !isAdmins || !isBotAdminCheck(participants, botId))
    return reply("*Need admin permission (you + bot)*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention or reply a user*");

  const groupAdmins = getGroupAdmins(participants);
  if (groupAdmins.includes(target))
    return reply("*Can't kick admin*");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "remove");
  return reply(`*Kicked:* @${target.split("@")[0]}`, { mentions: [target] });
});

// ================= TAGALL (FIXED) =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all members",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup || !isAdmins)
    return reply("*Admins only command*");

  let validParticipants = participants.filter(p => p.id);

  let mentions = validParticipants.map(p => p.id);

  let text = "📢 *Attention Everyone*\n\n";

  text += validParticipants
    .map(p => `@${p.id.split("@")[0]}`)
    .join(" ");

  return reply(text, { mentions });
});

// ================= SET PP =================
cmd({
  pattern: "setpp",
  desc: "Set group profile picture",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup || !isAdmins)
    return reply("❌ Admin only");

  if (!quoted?.message?.imageMessage)
    return reply("🖼️ Reply to an image");

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await danuwa.updateProfilePicture(m.chat, media);
    reply("✅ Updated");
  } catch (e) {
    reply("❌ Failed");
  }
});

// ================= ADMINS LIST =================
cmd({
  pattern: "admins",
  react: "👑",
  desc: "List admins",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, reply, participants }) => {

  if (!isGroup) return reply("*Group only*");

  const admins = participants
    .filter(p => p.admin)
    .map(p => `@${p.id.split("@")[0]}`)
    .join("\n");

  return reply(`*Admins:*\n${admins}`, {
    mentions: participants.filter(p => p.admin).map(a => a.id)
  });
});

// ================= ADD =================
cmd({
  pattern: "add",
  react: "➕",
  desc: "Add user",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, reply, args }) => {

  if (!isGroup || !isAdmins)
    return reply("Admin only");

  if (!args[0]) return reply("Give number");

  const target = args[0].includes("@")
    ? args[0]
    : `${args[0]}@s.whatsapp.net`;

  await danuwa.groupParticipantsUpdate(from, [target], "add");

  return reply(`✅ Added @${target.split("@")[0]}`, {
    mentions: [target]
  });
});

// ================= PROMOTE =================
cmd({
  pattern: "promote",
  react: "⬆️",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted, args, participants }) => {

  const botId = danuwa.user.id.split(":")[0] + "@s.whatsapp.net";

  if (!isGroup || !isAdmins || !isBotAdminCheck(participants, botId))
    return reply("*Need admin permission*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention user*");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "promote");

  return reply(`⬆️ Promoted @${target.split("@")[0]}`, {
    mentions: [target]
  });
});

// ================= DEMOTE =================
cmd({
  pattern: "demote",
  react: "⬇️",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted, args, participants }) => {

  const botId = danuwa.user.id.split(":")[0] + "@s.whatsapp.net";

  if (!isGroup || !isAdmins || !isBotAdminCheck(participants, botId))
    return reply("*Need admin permission*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention user*");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "demote");

  return reply(`⬇️ Demoted @${target.split("@")[0]}`, {
    mentions: [target]
  });
});

// ================= OPEN / CLOSE =================
cmd({
  pattern: "open",
  react: "⚠️",
}, async (danuwa, mek, m, { from, isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admin only");

  await danuwa.groupSettingUpdate(from, "not_announcement");
  reply("✅ Group Open");
});

cmd({
  pattern: "close",
  react: "🔒",
}, async (danuwa, mek, m, { from, isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admin only");

  await danuwa.groupSettingUpdate(from, "announcement");
  reply("🔒 Group Closed");
});
