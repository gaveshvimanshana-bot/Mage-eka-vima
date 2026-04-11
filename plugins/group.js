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

  if (!isGroup || !isAdmins) return reply("Admins only!");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("Mention or reply user!");

  const admins = getGroupAdmins(participants);
  if (admins.includes(target)) return reply("Can't kick admin!");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "remove");
  reply(`Kicked: @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= TAGALL =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all members",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  let text = "*📢 Attention Everyone!*\n\n";
  let mentions = participants.map(p => p.id);

  text += participants.map(p => `@${p.id.split("@")[0]}`).join(" ");

  reply(text, { mentions });
});


// ================= SET PP =================
cmd({
  pattern: "setpp",
  desc: "Set group profile pic",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  if (!quoted?.message?.imageMessage)
    return reply("Reply to image!");

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await danuwa.updateProfilePicture(m.chat, media);
    reply("Updated!");
  } catch (e) {
    reply("Failed!");
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

  if (!isGroup) return reply("Group only!");

  const admins = participants
    .filter(p => p.admin)
    .map(p => `@${p.id.split("@")[0]}`)
    .join("\n");

  reply(`*Admins:*\n${admins}`, {
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
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("Mention user!");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "demote");
  reply(`Demoted: @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= OPEN =================
cmd({
  pattern: "open",
  react: "🔓",
  desc: "Unmute group",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, from }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  await danuwa.groupSettingUpdate(from, "not_announcement");
  reply("Group opened!");
});


// ================= CLOSE =================
cmd({
  pattern: "close",
  react: "🔒",
  desc: "Mute group",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, from }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  await danuwa.groupSettingUpdate(from, "announcement");
  reply("Group closed!");
});


// ================= REVOKE =================
cmd({
  pattern: "revoke",
  react: "♻️",
  desc: "Reset link",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  await danuwa.groupRevokeInvite(m.chat);
  reply("Link reset!");
});


// ================= GROUP LINK =================
cmd({
  pattern: "grouplink",
  alias: ["link"],
  react: "🔗",
  desc: "Get link",
  category: "group",
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
}, async (danuwa, mek, m, { isGroup, isAdmins, args, reply }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");
  if (!args[0]) return reply("Give name!");

  await danuwa.groupUpdateSubject(m.chat, args.join(" "));
  reply("Updated!");
});


// ================= SET DESC =================
cmd({
  pattern: "setdesc",
  react: "📝",
  desc: "Change desc",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, args, reply }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");
  if (!args[0]) return reply("Give desc!");

  await danuwa.groupUpdateDescription(m.chat, args.join(" "));
  reply("Updated!");
});


// ================= GROUP INFO =================
cmd({
  pattern: "groupinfo",
  alias: ["ginfo"],
  react: "📄",
  desc: "Group info",
  category: "group",
}, async (danuwa, mek, m, { isGroup, reply }) => {

  if (!isGroup) return reply("Group only!");

  const meta = await danuwa.groupMetadata(m.chat);

  const admins = meta.participants.filter(p => p.admin).length;

  const creation = meta.creation
    ? new Date(meta.creation * 1000).toLocaleString()
    : "Unknown";

  let txt = `*${meta.subject}*\n\n`;
  txt += `Members: ${meta.participants.length}\n`;
  txt += `Admins: ${admins}\n`;
  txt += `Created: ${creation}\n`;

  reply(txt);
});


// ================= DEL (FIXED REAL DELETE) =================
cmd({
  pattern: "del",
  react: "🗑️",
  desc: "Delete replied message",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup) return reply("Group only!");
  if (!isAdmins) return reply("Admins only!");

  if (!quoted) return reply("Reply to message!");

  try {
    await danuwa.sendMessage(m.chat, {
      delete: quoted.key
    });

    reply("Deleted!");
  } catch (e) {
    console.log(e);
    reply("Failed!");
  }
});
