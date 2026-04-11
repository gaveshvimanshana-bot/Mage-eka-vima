const { cmd } = require("../command");
const { getGroupAdmins } = require("../lib/functions");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");


// ================= TARGET USER HELPER =================
function getTargetUser(m, quoted, args) {
  const msg = m.message;

  if (msg?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return msg.extendedTextMessage.contextInfo.mentionedJid[0];
  }

  if (quoted?.sender) {
    return quoted.sender;
  }

  if (args[0]) {
    let num = args[0].replace(/[^0-9]/g, "");
    return num ? num + "@s.whatsapp.net" : null;
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
}, async (conn, m, ctx, { isGroup, isAdmins, reply, participants, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("*Group only & admin required*");

  const target = getTargetUser(m, quoted, args);
  if (!target) return reply("*Mention or reply to a user*");

  const admins = getGroupAdmins(participants);
  if (admins.includes(target))
    return reply("*I can't kick an admin*");

  await conn.groupParticipantsUpdate(m.chat, [target], "remove");

  return reply(`*Kicked:* @${target.split("@")[0]}`, {
    mentions: [target]
  });
});


// ================= TAGALL =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all members",
  category: "group",
  filename: __filename,
}, async (conn, m, ctx, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup) return reply("*Group only*");
  if (!isAdmins) return reply("*Admins only*");

  let mentions = participants.map(p => p.id);

  let text = "*📢 Attention everyone*\n\n";

  for (let p of participants) {
    text += `@${p.id.split("@")[0]} `;
  }

  return await conn.sendMessage(m.chat, {
    text,
    mentions
  }, { quoted: m });
});


// ================= SET PP =================
cmd({
  pattern: "setpp",
  desc: "Set group profile picture",
  category: "group",
  filename: __filename
}, async (conn, m, ctx, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup) return reply("❌ Group only");
  if (!isAdmins) return reply("❌ Admin only");

  if (!quoted?.message?.imageMessage)
    return reply("🖼️ Reply to an image");

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await conn.updateProfilePicture(m.chat, media);
    reply("✅ Group PP updated");
  } catch (e) {
    console.error(e);
    reply("❌ Failed to set PP");
  }
});


// ================= ADMINS LIST =================
cmd({
  pattern: "admins",
  react: "👑",
  desc: "List admins",
  category: "group",
  filename: __filename,
}, async (conn, m, ctx, { isGroup, reply, participants }) => {

  if (!isGroup) return reply("*Group only*");

  const admins = participants
    .filter(p => p.admin)
    .map(p => `@${p.id.split("@")[0]}`)
    .join("\n");

  return reply(`*Admins:*\n${admins}`, {
    mentions: participants.filter(p => p.admin).map(a => a.id)
  });
});


// ================= ADD USER =================
cmd({
  pattern: "add",
  alias: ["invite"],
  react: "➕",
  desc: "Add user",
  category: "group",
  filename: __filename
}, async (conn, m, ctx, { isGroup, isAdmins, reply, args }) => {

  if (!isGroup) return reply("*Group only*");
  if (!isAdmins) return reply("*Admins only*");

  if (!args[0]) return reply("*Give number*");

  const target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  try {
    await conn.groupParticipantsUpdate(m.chat, [target], "add");
    reply(`✅ Added @${target.split("@")[0]}`, { mentions: [target] });
  } catch (e) {
    reply("❌ Failed to add user");
  }
});


// ================= PROMOTE =================
cmd({
  pattern: "promote",
  react: "⬆️",
  desc: "Promote user",
  category: "group",
  filename: __filename,
}, async (conn, m, ctx, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("*Group only & admin required*");

  const target = getTargetUser(m, quoted, args);
  if (!target) return reply("*Mention or reply user*");

  await conn.groupParticipantsUpdate(m.chat, [target], "promote");

  return reply(`*Promoted:* @${target.split("@")[0]}`, {
    mentions: [target]
  });
});


// ================= DEMOTE =================
cmd({
  pattern: "demote",
  react: "⬇️",
  desc: "Demote admin",
  category: "group",
  filename: __filename,
}, async (conn, m, ctx, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("*Group only & admin required*");

  const target = getTargetUser(m, quoted, args);
  if (!target) return reply("*Mention or reply user*");

  await conn.groupParticipantsUpdate(m.chat, [target], "demote");

  return reply(`*Demoted:* @${target.split("@")[0]}`, {
    mentions: [target]
  });
});


// ================= OPEN GROUP =================
cmd({
  pattern: "open",
  alias: ["unmute"],
  react: "🔓",
  desc: "Open group",
  category: "group",
  filename: __filename
}, async (conn, m, ctx, { isGroup, isAdmins, reply }) => {

  if (!isGroup) return reply("*Group only*");
  if (!isAdmins) return reply("*Admins only*");

  await conn.groupSettingUpdate(m.chat, "not_announcement");

  reply("✅ Group opened");
});


// ================= CLOSE GROUP =================
cmd({
  pattern: "close",
  alias: ["mute"],
  react: "🔒",
  desc: "Close group",
  category: "group",
  filename: __filename
}, async (conn, m, ctx, { isGroup, isAdmins, reply }) => {

  if (!isGroup) return reply("*Group only*");
  if (!isAdmins) return reply("*Admins only*");

  await conn.groupSettingUpdate(m.chat, "announcement");

  reply("🔒 Group closed");
});


// ================= REVOKE LINK =================
cmd({
  pattern: "revoke",
  react: "♻️",
  desc: "Reset invite link",
  category: "group",
  filename: __filename,
}, async (conn, m, ctx, { isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins)
    return reply("*Admin required*");

  await conn.groupRevokeInvite(m.chat);

  reply("✅ Link reset");
});


// ================= GROUP LINK =================
cmd({
  pattern: "grouplink",
  alias: ["link"],
  react: "🔗",
  desc: "Get group link",
  category: "group",
