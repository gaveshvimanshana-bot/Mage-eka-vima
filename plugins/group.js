const { cmd } = require("../command");
const { getGroupAdmins, getTargetUser } = require("../lib/functions");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");


// ================= KICK =================
cmd({
  pattern: "kick",
  react: "👢",
  desc: "Kick user",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants, quoted, args }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("Reply or mention user!");

  const admins = getGroupAdmins(participants);
  if (admins.includes(target)) return reply("Can't kick admin!");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "remove");
  reply(`Kicked: @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= TAGALL =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  let mentions = participants.map(p => p.id);
  let text = "*📢 Everyone!*\n\n";

  text += participants.map(p => `@${p.id.split("@")[0]}`).join(" ");

  reply(text, { mentions });
});


// ================= SET PP =================
cmd({
  pattern: "setpp",
  desc: "Set group pic",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  if (!quoted?.message?.imageMessage)
    return reply("Reply image!");

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await danuwa.updateProfilePicture(m.chat, media);
    reply("Updated!");
  } catch {
    reply("Failed!");
  }
});


// ================= ADMINS =================
cmd({
  pattern: "admins",
  react: "👑",
  desc: "List admins",
  category: "group",
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
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins) return reply("Admins only!");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("Reply user!");

  await danuwa.groupParticipantsUpdate(m.chat, [target], "demote");
  reply(`Demoted: @${target.split("@")[0]}`, { mentions: [target] });
});


// ================= OPEN =================
cmd({
  pattern: "open",
  react: "🔓",
  desc: "Open group",
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
  desc: "Close group",
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
  desc: "Change name",
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

  reply(
`*${meta.subject}*

👥 Members: ${meta.participants.length}
👑 Admins: ${admins}
📅 Created: ${creation}`
  );
});


// ================= 🔥 FIXED DEL COMMAND =================
cmd({
  pattern: "del",
  react: "🗑️",
  desc: "Delete replied message",
  category: "group",
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup) return reply("Group only!");
  if (!isAdmins) return reply("Admins only!");
  if (!quoted) return reply("Reply message!");

  try {

    const key = {
      remoteJid: m.chat,
      id: quoted.key.id,
      participant: quoted.key.participant || quoted.key.remoteJid
    };

    await danuwa.sendMessage(m.chat, {
      delete: key
    });

    reply("🗑️ Deleted!");
  } catch (e) {
    console.log(e);
    reply("❌ Failed!");
  }
});
