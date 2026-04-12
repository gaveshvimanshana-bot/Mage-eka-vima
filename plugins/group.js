const { cmd } = require("../command");
const { getGroupAdmins } = require("../lib/functions");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Helper function to get target user
function getTargetUser(mek, quoted, args) {
  if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
  } else if (quoted?.sender) {
    return quoted.sender;
  } else if (args[0]?.includes("@")) {
    return args[0].replace("@", "") + "@s.whatsapp.net";
  } else if (args[0]?.match(/^\d+$/)) {
    // If just number provided
    return args[0] + "@s.whatsapp.net";
  }
  return null;
}

// ==================== KICK ====================
cmd({
  pattern: "kick",
  react: "👢",
  desc: "Kick user from group",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, reply, participants, quoted, args, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*You must be an admin to use this command.*");
    if (!isBotAdmins) return reply("*I need to be an admin to kick users.*");

    const target = getTargetUser(mek, quoted, args);
    if (!target) return reply("*Mention, reply to, or provide number of user to kick.*\n\nExample:\n.kick @94712345678\n.kick 94712345678\n.kick (reply to user)");

    const groupAdmins = getGroupAdmins(participants);
    if (groupAdmins.includes(target)) 
      return reply("*I can't kick an admin.*");

    await danuwa.groupParticipantsUpdate(from, [target], "remove");
    return reply(`*Kicked:* @${target.split("@")[0]}`, { mentions: [target] });
    
  } catch (e) {
    console.error("Kick Error:", e);
    reply(`❌ Failed to kick user. Error: ${e.message}`);
  }
});

// ==================== TAGALL ====================
cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all group members",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, reply, participants, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*Only group admins can use this command.*");

    if (!participants || participants.length === 0) {
      return reply("*No participants found in this group.*");
    }

    let mentions = participants.map(p => p.id);
    let text = "*📢 Attention everyone:*\n\n";

    // Add mentions as text
    for (let i = 0; i < participants.length; i++) {
      text += `@${participants[i].id.split("@")[0]} `;
      if ((i + 1) % 5 === 0) text += "\n"; // New line every 5 mentions
    }

    text += `\n\n> _Vima-MD TagAll_`;

    return reply(text, { mentions });

  } catch (e) {
    console.error("Tagall Error:", e);
    reply(`❌ Failed to tag all. Error: ${e.message}`);
  }
});

// ==================== SETPP (SET GROUP PP) ====================
cmd({
  pattern: "setpp",
  alias: ["setgrouppp", "grouppp"],
  desc: "Set group profile picture",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, reply, from, quoted }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isAdmins) return reply("❌ You must be a group admin to use this command!");
    if (!isBotAdmins) return reply("❌ I need to be an admin to change group picture!");

    if (!quoted?.message?.imageMessage) {
      return reply("🖼️ Please reply to an image to set as the group profile photo.");
    }

    await reply("⏳ *Updating group picture...*");

    const media = await downloadMediaMessage(quoted, 'buffer');
    
    if (!media) {
      return reply("❌ Failed to download image.");
    }

    await danuwa.updateProfilePicture(from, media);
    reply("✅ Group profile picture updated successfully!");
    
  } catch (e) {
    console.error("❌ SetPP Error:", e);
    reply("⚠️ Failed to set profile picture. Ensure:\n• Image is valid\n• Image size is not too large\n• I have admin rights");
  }
});

// ==================== ADMINS ====================
cmd({
  pattern: "admins",
  alias: ["adminlist", "listadmins"],
  react: "👑",
  desc: "List all group admins",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, reply, participants, from }) => {
  try {
    if (!isGroup) return reply("*This command is for groups only.*");

    const admins = participants.filter(p => p.admin);
    
    if (admins.length === 0) {
      return reply("*No admins found in this group.*");
    }

    let text = `*👑 Group Admins (${admins.length}):*\n\n`;
    
    admins.forEach((admin, index) => {
      const adminType = admin.admin === 'superadmin' ? '👤 Owner' : '⭐ Admin';
      text += `${index + 1}. ${adminType}: @${admin.id.split("@")[0]}\n`;
    });

    return reply(text, { mentions: admins.map(a => a.id) });
    
  } catch (e) {
    console.error("Admins Error:", e);
    reply("❌ Failed to get admin list.");
  }
});

// ==================== ADD ====================
cmd({
  pattern: "add",
  alias: ["invite", "adduser"],
  react: "➕",
  desc: "Add a user to the group",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply, args }) => {
  try {
    if (!isGroup) return reply("⚠️ This command can only be used in a group!");
    if (!isAdmins) return reply("⚠️ Only group admins can use this command!");
    if (!isBotAdmins) return reply("⚠️ I need to be an admin to add users!");

    if (!args[0]) {
      return reply("⚠️ Please provide the phone number of the user to add!\n\nExample:\n.add 94712345678\n.add @94712345678");
    }

    // Handle both @947... and 947... formats
    let target = args[0];
    if (target.includes("@")) {
      target = target.replace("@", "") + "@s.whatsapp.net";
    } else {
      target = target + "@s.whatsapp.net";
    }

    await reply(`⏳ *Adding user...*`);
    
    await danuwa.groupParticipantsUpdate(from, [target], "add");

    return reply(`✅ Successfully added: @${target.split('@')[0]}`, { mentions: [target] });
    
  } catch (e) {
    console.error("Add Error:", e);
    reply(`❌ Failed to add user. Error: ${e.message}\n\n💡 Tips:\n• User must be in your contacts\n• Number must be valid\n• User might have privacy settings enabled`);
  }
});

// ==================== PROMOTE ====================
cmd({
  pattern: "promote",
  alias: ["makeadmin", "admin"],
  react: "⬆️",
  desc: "Promote user to admin",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, reply, participants, quoted, args, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*You must be an admin to use this command.*");
    if (!isBotAdmins) return reply("*I need to be an admin to promote users.*");

    const target = getTargetUser(mek, quoted, args);
    if (!target) return reply("*Mention, reply to, or provide number of user to promote.*\n\nExample:\n.promote @94712345678\n.promote 94712345678\n.promote (reply to user)");

    // Check if already admin
    const groupAdmins = getGroupAdmins(participants);
    if (groupAdmins.includes(target)) {
      return reply("*User is already an admin.*");
    }

    await danuwa.groupParticipantsUpdate(from, [target], "promote");
    return reply(`*⬆️ Promoted to Admin:* @${target.split("@")[0]}`, { mentions: [target] });
    
  } catch (e) {
    console.error("Promote Error:", e);
    reply(`❌ Failed to promote user. Error: ${e.message}`);
  }
});

// ==================== DEMOTE ====================
cmd({
  pattern: "demote",
  alias: ["removeadmin", "unadmin"],
  react: "⬇️",
  desc: "Demote admin to member",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, reply, participants, quoted, args, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*You must be an admin to use this command.*");
    if (!isBotAdmins) return reply("*I need to be an admin to demote users.*");

    const target = getTargetUser(mek, quoted, args);
    if (!target) return reply("*Mention, reply to, or provide number of user to demote.*\n\nExample:\n.demote @94712345678\n.demote 94712345678\n.demote (reply to user)");

    // Check if user is admin
    const groupAdmins = getGroupAdmins(participants);
    if (!groupAdmins.includes(target)) {
      return reply("*User is not an admin.*");
    }

    // Check if trying to demote owner
    const metadata = await danuwa.groupMetadata(from);
    if (metadata.owner === target) {
      return reply("*❌ Cannot demote the group owner.*");
    }

    await danuwa.groupParticipantsUpdate(from, [target], "demote");
    return reply(`*⬇️ Demoted to Member:* @${target.split("@")[0]}`, { mentions: [target] });
    
  } catch (e) {
    console.error("Demote Error:", e);
    reply(`❌ Failed to demote user. Error: ${e.message}`);
  }
});

// ==================== OPEN (UNMUTE) ====================
cmd({
  pattern: "open",
  alias: ["unmute", "unlock"],
  react: "🔓",
  desc: "Allow everyone to send messages",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {
    if (!isGroup) return reply("⚠️ This command can only be used in a group!");
    if (!isAdmins) return reply("⚠️ Only group admins can use this command!");
    if (!isBotAdmins) return reply("⚠️ I need to be an admin to unlock the group!");

    await danuwa.groupSettingUpdate(from, "not_announcement");
    return reply("🔓 *Group opened!*\n\nEveryone can send messages now.");
    
  } catch (e) {
    console.error("Open Error:", e);
    reply(`❌ Failed to open group. Error: ${e.message}`);
  }
});

// ==================== CLOSE (MUTE) ====================
cmd({
  pattern: "close",
  alias: ["mute", "lock"],
  react: "🔒",
  desc: "Set group to admin-only messages",
  category: "group",
  filename: __filename
}, async (danuwa, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {
    if (!isGroup) return reply("⚠️ This command can only be used in a group!");
    if (!isAdmins) return reply("⚠️ Only group admins can use this command!");
    if (!isBotAdmins) return reply("⚠️ I need to be an admin to lock the group!");

    await danuwa.groupSettingUpdate(from, "announcement");
    return reply("🔒 *Group locked!*\n\nOnly admins can send messages now.");
    
  } catch (e) {
    console.error("Close Error:", e);
    reply(`❌ Failed to close group. Error: ${e.message}`);
  }
});

// ==================== REVOKE ====================
cmd({
  pattern: "revoke",
  alias: ["resetlink", "newlink"],
  react: "♻️",
  desc: "Reset group invite link",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*Only admins can reset the invite link.*");
    if (!isBotAdmins) return reply("*I need to be an admin to reset the link.*");

    await danuwa.groupRevokeInvite(from);
    return reply("♻️ *Group invite link has been reset!*\n\n💡 Use .grouplink to get the new link.");
    
  } catch (e) {
    console.error("Revoke Error:", e);
    reply("❌ Failed to reset invite link.");
  }
});

// ==================== GROUPLINK ====================
cmd({
  pattern: "grouplink",
  alias: ["link", "invitelink"],
  react: "🔗",
  desc: "Get current invite link",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isBotAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isBotAdmins) return reply("*I need to be an admin to get the invite link.*");

    const code = await danuwa.groupInviteCode(from);
    const link = `https://chat.whatsapp.com/${code}`;
    
    return reply(`🔗 *Group Invite Link:*\n\n${link}\n\n💡 Anyone can join using this link.`);
    
  } catch (e) {
    console.error("GroupLink Error:", e);
    reply("❌ Failed to get invite link. Make sure I am an admin.");
  }
});

// ==================== SETSUBJECT ====================
cmd({
  pattern: "setsubject",
  alias: ["setname", "groupname", "gname"],
  react: "✏️",
  desc: "Change group name",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*Only admins can change group name.*");
    if (!isBotAdmins) return reply("*I need to be an admin to change group name.*");

    if (!args[0]) return reply("*Please provide a new group name.*\n\nExample: .setname My Awesome Group");

    const newName = args.join(" ");
    if (newName.length > 25) {
      return reply("⚠️ Group name too long! Maximum 25 characters.");
    }

    await danuwa.groupUpdateSubject(from, newName);
    return reply(`✏️ *Group name updated to:*\n${newName}`);
    
  } catch (e) {
    console.error("SetSubject Error:", e);
    reply("❌ Failed to update group name.");
  }
});

// ==================== SETDESC ====================
cmd({
  pattern: "setdesc",
  alias: ["setdescription", "groupdesc", "gdesc"],
  react: "📝",
  desc: "Change group description",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply, from }) => {
  try {
    if (!isGroup) return reply("*This command can only be used in groups.*");
    if (!isAdmins) return reply("*Only admins can change group description.*");
    if (!isBotAdmins) return reply("*I need to be an admin to change description.*");

    if (!args[0]) return reply("*Please provide a new group description.*\n\nExample: .setdesc Welcome to our group!");

    const newDesc = args.join(" ");
    await danuwa.groupUpdateDescription(from, newDesc);
    return reply(`📝 *Group description updated!*`);
    
  } catch (e) {
    console.error("SetDesc Error:", e);
    reply("❌ Failed to update group description.");
  }
});

// ==================== GROUPINFO ====================
cmd({
  pattern: "groupinfo",
  alias: ["ginfo", "groupstats"],
  react: "📄",
  desc: "Show group details",
  category: "group",
  filename: __filename,
}, async (danuwa, mek, m, { isGroup, reply, from }) => {
  try {
    if (!isGroup) return reply("*This command is for groups only.*");

    const metadata = await danuwa.groupMetadata(from);
    const adminsCount = metadata.participants.filter(p => p.admin).length;
    const creation = new Date(metadata.creation * 1000).toLocaleString();
    const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id;
    const desc = metadata.desc || "No description set.";
    const isLocked = metadata.announce === true;

    let txt = `╭━━━〔 📄 *GROUP INFO* 〕━━━┈⊷\n`;
    txt += `┃\n`;
    txt += `┃ 👥 *Name:* ${metadata.subject}\n`;
    txt += `┃ 🆔 *ID:* ${metadata.id}\n`;
    txt += `┃ 👤 *Owner:* ${owner ? `@${owner.split("@")[0]}` : "Not found"}\n`;
    txt += `┃ 📅 *Created:* ${creation}\n`;
    txt += `┃ 👤 *Members:* ${metadata.participants.length}\n`;
    txt += `┃ 🛡️ *Admins:* ${adminsCount}\n`;
    txt += `┃ 🔒 *Status:* ${isLocked ? "🔒 Admin Only" : "🔓 Open"}\n`;
    txt += `┃\n`;
    txt += `┃ 📝 *Description:*\n`;
    txt += `┃ ${desc}\n`;
    txt += `┃\n`;
    txt += `╰━━━━━━━━━━━━━━━━━━━━┈⊷\n`;
    txt += `> _Vima-MD Group Info_`;

    return reply(txt, { mentions: owner ? [owner] : [] });
    
  } catch (e) {
    console.error("GroupInfo Error:", e);
    reply("❌ Failed to get group info.");
  }
});
