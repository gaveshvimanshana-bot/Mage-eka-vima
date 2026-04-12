const { cmd } = require("../command");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

// ================= TARGET USER FIX =================
function getTargetUser(mek, quoted, args) {
  const context = mek.message?.extendedTextMessage?.contextInfo;

  if (context?.mentionedJid?.length) {
    return context.mentionedJid[0];
  }

  if (quoted?.key?.participant) {
    return quoted.key.participant;
  }

  if (quoted?.sender) {
    return quoted.sender;
  }

  if (args?.[0]?.includes("@")) {
    return args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  }

  if (args?.[0]) {
    return args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
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
}, async (conn, mek, m, { isGroup, isAdmins, reply, participants, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("❌ Group only & bot + you must be admin");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("❌ Mention or reply user");

  const groupAdmins = participants
    .filter(p => p.admin)
    .map(p => p.id);

  if (groupAdmins.includes(target))
    return reply("❌ Can't kick admin");

  await conn.groupParticipantsUpdate(m.chat, [target], "remove");
  return reply(`👢 Kicked: @${target.split("@")[0]}`, { mentions: [target] });
});

// ================= TAGALL =================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all members",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, { isGroup, isAdmins, reply, participants }) => {

  if (!isGroup) return reply("❌ Group only");
  if (!isAdmins) return reply("❌ Admin only");

  let valid = participants.filter(p => {
    const num = p.id.split("@")[0];
    return /^\d{10,15}$/.test(num);
  });

  let mentions = valid.map(p => p.id);

  let text = "📢 *Attention Everyone*\n\n";
  text += valid.map(p => `@${p.id.split("@")[0]}`).join(" ");

  return reply(text, { mentions });
});

// ================= SET PP =================
cmd({
  pattern: "setpp",
  desc: "Set group dp",
  category: "group",
  filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, reply, quoted }) => {

  if (!isGroup) return reply("❌ Group only");
  if (!isAdmins) return reply("❌ Admin only");

  if (!quoted?.message?.imageMessage &&
      !quoted?.message?.viewOnceMessageV2?.message?.imageMessage) {
    return reply("🖼️ Reply to image");
  }

  try {
    const media = await downloadMediaMessage(quoted, "buffer");
    await conn.updateProfilePicture(m.chat, media);
    reply("✅ DP updated");
  } catch (e) {
    console.log(e);
    reply("❌ Failed to update DP");
  }
});

// ================= ADMINS =================
cmd({
  pattern: "admins",
  react: "👑",
  desc: "List admins",
  category: "group",
  filename: __filename,
}, async (conn, mek, m, { isGroup, reply, participants }) => {

  if (!isGroup) return reply("❌ Group only");

  const admins = participants
    .filter(p => p.admin)
    .map(p => `@${p.id.split("@")[0]}`)
    .join("\n");

  return reply(`👑 *Admins:*\n${admins}`, {
    mentions: participants.filter(p => p.admin).map(a => a.id)
  });
});

// ================= ADD =================
cmd({
  pattern: "add",
  react: "➕",
  category: "group",
}, async (conn, mek, m, { isGroup, isAdmins, reply, args }) => {

  if (!isGroup) return reply("❌ Group only");
  if (!isAdmins) return reply("❌ Admin only");

  if (!args[0]) return reply("❌ Give number");

  const num = args[0].replace(/[^0-9]/g, "");
  const target = num + "@s.whatsapp.net";

  await conn.groupParticipantsUpdate(m.chat, [target], "add");

  return reply(`✅ Added: @${num}`, { mentions: [target] });
});

// ================= PROMOTE =================
cmd({
  pattern: "promote",
  react: "⬆️",
  category: "group",
}, async (conn, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("❌ Admin only");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("❌ Mention user");

  await conn.groupParticipantsUpdate(m.chat, [target], "promote");
  return reply(`⬆️ Promoted: @${target.split("@")[0]}`, { mentions: [target] });
});

// ================= DEMOTE =================
cmd({
  pattern: "demote",
  react: "⬇️",
  category: "group",
}, async (conn, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {

  if (!isGroup || !isAdmins)
    return reply("❌ Admin only");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("❌ Mention user");

  await conn.groupParticipantsUpdate(m.chat, [target], "demote");
  return reply(`⬇️ Demoted: @${target.split("@")[0]}`, { mentions: [target] });
});

// ================= OPEN / CLOSE =================
cmd({
  pattern: "open",
  category: "group",
}, async (conn, mek, m, { isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins) return reply("❌ Admin only");

  await conn.groupSettingUpdate(m.chat, "not_announcement");
  return reply("🔓 Group Open");
});

cmd({
  pattern: "close",
  category: "group",
}, async (conn, mek, m, { isGroup, isAdmins, reply }) => {

  if (!isGroup || !isAdmins) return reply("❌ Admin only");

  await conn.groupSettingUpdate(m.chat, "announcement");
  return reply("🔒 Group Closed");
});

// ================= LINK =================
cmd({
  pattern: "grouplink",
  category: "group",
}, async (conn, mek, m, { isGroup, reply }) => {

  if (!isGroup) return reply("❌ Group only");

  const code = await conn.groupInviteCode(m.chat);
  reply(`🔗 https://chat.whatsapp.com/${code}`);
});
