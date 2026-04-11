const { cmd } = require("../command");
const { getGroupAdmins, getTargetUser } = require("../lib/functions");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");


// ================= KICK =================
cmd({
  pattern: "kick",
  react: "👢",
  desc: "Kick user from group",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("*Group only & admins only!*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention or reply to a user!*");

  const groupAdmins = getGroupAdmins(participants);
  if (groupAdmins.includes(target))
    return reply("*I can't kick an admin!*");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "remove");
  return reply(`*Kicked:* @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= TAGALL =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all members",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup) return reply("*Group only!*");
  if (!isAdmins) return reply("*Admins only!*");

  let mentions = participants.map(p => p.id);
  let text = "*📢 Attention Everyone!*\n\n";

  text += participants.map(p => `@${p.id.split("@")[0]}`).join(" ");

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
    return reply("❌ Admins only!");

  if (!quoted?.message?.imageMessage)
    return reply("🖼️ Reply to an image!");

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await danuwa.updateProfilePicture(m.chat, media);
    reply("✅ Updated!");
  } catch (e) {
    reply("❌ Failed!");
  }
});


// ================= ADMINS =================
cmd({
  pattern: "admins",
  react: "👑",
  desc: "List admins",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, reply, participants }) => {

  if (!isGroup) return reply("*Group only!*");

  const admins = participants
    .filter(p => p.admin)
    .map(p => `@${p.id.split("@")[0]}`)
    .join("\n");

  return reply(`*👑 Admins:*\n${admins}`, {
    mentions: participants.filter(p => p.admin).map(a => a.id)
  });
});


// ================= DEMOTE =================
cmd({
  pattern: "demote",
  react: "⬇️",
  desc: "Demote admin",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted, args, participants }) => {

  if (!isGroup || !isAdmins)
    return reply("*Admins only!*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention user!*");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "demote");
  return reply(`*Demoted:* @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= OPEN =================
cmd({
  pattern: "open",
  react: "🔓",
  desc: "Unmute group",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admins only!");

  await danuwa.groupSettingUpdate(from, "not_announcement");
  reply("🔓 Group opened!");
});


// ================= CLOSE =================
cmd({
  pattern: "close",
  react: "🔒",
  desc: "Mute group",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admins only!");

  await danuwa.groupSettingUpdate(from, "announcement");
  reply("🔒 Group closed!");
});


// ================= REVOKE =================
cmd({
  pattern: "revoke",
  react: "♻️",
  desc: "Reset invite link",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admins only!");

  await danuwa.groupRevokeInvite(m.chat);
  reply("♻️ Link reset!");
});


// ================= GROUP LINK =================
cmd({
  pattern: "grouplink",
  alias: ["link"],
  react: "🔗",
  desc: "Get group link",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, reply }) => {

  if (!isGroup) return reply("Group only!");

  const code = await danuwa.groupInviteCode(m.chat);
  reply("https://chat.whatsapp.com/" + code);
});


// ================= SET SUBJECT =================
cmd({
  pattern: "setsubject",
  react: "✏️",
  desc: "Change group name",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, args, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admins only!");

  if (!args[0]) return reply("Give name!");

  await danuwa.groupUpdateSubject(m.chat, args.join(" "));
  reply("✅ Name updated!");
});


// ================= SET DESC =================
cmd({
  pattern: "setdesc",
  react: "📝",
  desc: "Change group description",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, args, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("Admins only!");

  if (!args[0]) return reply("Give description!");

  await danuwa.groupUpdateDescription(m.chat, args.join(" "));
  reply("✅ Description updated!");
});


// ================= GROUP INFO =================
cmd({
  pattern: "groupinfo",
  alias: ["ginfo"],
  react: "📄",
  desc: "Group info",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, reply }) => {

  if (!isGroup) return reply("Group only!");

  const metadata = await danuwa.groupMetadata(m.chat);

  const admins = metadata.participants.filter(p => p.admin).length;

  const creation = metadata.creation
    ? new Date(metadata.creation * 1000).toLocaleString()
    : "Unknown";

  const owner = metadata.owner;

  let txt = `*👥 ${metadata.subject}*\n\n`;
  txt += `📌 Members: ${metadata.participants.length}\n`;
  txt += `👑 Admins: ${admins}\n`;
  txt += `📅 Created: ${creation}\n`;
  txt += `🆔 ID: ${metadata.id}\n`;

  reply(txt);
});


// ================= DEL MESSAGE =================
cmd({
  pattern: "del",
  react: "🗑️",
  desc: "Delete replied message",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup) return reply("Group only!");
  if (!isAdmins) return reply("Admins only!");

  if (!quoted) return reply("Reply to a message!");

  try {
    await danuwa.sendMessage(m.chat, {
      delete: quoted.key
    });

    reply("🗑️ Deleted!");
  } catch (e) {
    reply("❌ Failed!");
  }
});
