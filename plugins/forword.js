const { cmd } = require("../command");

// Store group settings (use Map for memory, upgrade to DB for production)
const groupSettings = new Map();

// Random reactions pool
const reactions = {
  welcome: ["👋", "🎉", "✨", "🌟", "💖", "🙏", "🤝", "😊"],
  goodbye: ["👋", "😢", "💔", "🥺", "👋🏻", "✌️", "🙋", "😔"],
  message: ["❤️", "👍", "🔥", "😂", "😮", "😢", "👏", "🎉", "💯", "🤔", "😍", "🥰"],
  admin: ["👑", "⭐", "🎯", "💎", "🔱"],
  bot: ["🤖", "⚡", "🚀", "💙", "✨"]
};

// Get random item
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ==================== AUTO REACT ON MESSAGES ====================
// This uses the message event handler
cmd({
  pattern: "autoreact",
  desc: "Auto react handler (internal)",
  category: "ai",
  on: "text",  // Event handler
}, async (bot, mek, m, { isGroup, from, sender, isAdmins, reply }) => {
  try {
    if (!isGroup) return;
    
    const settings = groupSettings.get(from) || { autoReact: true };
    if (!settings.autoReact) return;

    // Don't react to bot's own messages
    const botNumber = bot.user.id.split(':')[0] + '@s.whatsapp.net';
    if (sender === botNumber) return;

    // 30% chance to react
    if (Math.random() > 0.7) {
      let reaction;
      if (isAdmins) {
        reaction = getRandom(reactions.admin);
      } else {
        reaction = getRandom(reactions.message);
      }

      await bot.sendMessage(from, {
        react: {
          text: reaction,
          key: mek.key
        }
      });
    }

  } catch (err) {
    // Silent fail - don't spam errors
    console.log("Auto react error:", err.message);
  }
});

// ==================== WELCOME/GOODBYE HANDLER ====================
cmd({
  pattern: "welcomehandler",
  desc: "Welcome/Goodbye handler (internal)",
  category: "ai",
  on: "group-participants-update",  // Event handler
}, async (bot, mek, m, { isGroup, from, action, participants, reply }) => {
  try {
    if (!isGroup) return;
    
    const settings = groupSettings.get(from) || { welcome: true, goodbye: true };
    
    // Get group metadata for name
    let groupName = "our group";
    try {
      const metadata = await bot.groupMetadata(from);
      groupName = metadata.subject || "our group";
    } catch (e) {}

    // WELCOME
    if (action === "add" && settings.welcome) {
      for (let user of participants) {
        const userTag = `@${user.split('@')[0]}`;
        
        // Use custom welcome if set
        let welcomeMsg;
        if (settings.customWelcome) {
          welcomeMsg = settings.customWelcome
            .replace(/{user}/g, userTag)
            .replace(/{group}/g, groupName)
            .replace(/{count}/g, participants.length);
        } else {
          welcomeMsg = `
╭━━━〔 🎉 *WELCOME* 〕━━━┈⊷
┃
┃  👋 Hello ${userTag}!
┃
┃  ✨ Welcome to *${groupName}*
┃
┃  📜 Please read the rules
┃  🤝 Be respectful to everyone
┃  💬 Enjoy your stay!
┃
╰━━━━━━━━━━━━━━┈⊷

> _Powered by Vima-MD_`;
        }

        await bot.sendMessage(from, {
          text: welcomeMsg,
          mentions: [user]
        });

        // React to welcome
        await bot.sendMessage(from, {
          react: {
            text: getRandom(reactions.welcome),
            key: mek.key
          }
        });
      }
    }

    // GOODBYE
    if (action === "remove" && settings.goodbye) {
      for (let user of participants) {
        const userTag = `@${user.split('@')[0]}`;
        const goodbyeMsg = `
╭━━━〔 👋 *GOODBYE* 〕━━━┈⊷
┃
┃  😢 ${userTag} has left
┃
┃  🌟 Thanks for being here
┃  👋 See you again soon!
┃
╰━━━━━━━━━━━━━━┈⊷

> _Vima-MD Bot_`;

        await bot.sendMessage(from, {
          text: goodbyeMsg,
          mentions: [user]
        });
      }
    }

  } catch (err) {
    console.error("Welcome/Goodbye error:", err.message);
  }
});

// ==================== MANUAL REACT COMMAND ====================
cmd({
  pattern: "react",
  alias: ["reaction", "r"],
  react: "⚡",
  desc: "React to a message with custom emoji",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, reply, from, isQuoted, quoted, q }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isQuoted) return reply("❌ *Reply to a message to react!*");

    // Get emoji from command args
    const args = q ? q.trim().split(' ') : [];
    const emoji = args[0] || getRandom(reactions.message);

    await bot.sendMessage(from, {
      react: {
        text: emoji,
        key: quoted.key
      }
    });

  } catch (err) {
    console.error("React error:", err);
    reply("❌ *Failed to react!*");
  }
});

// ==================== TOGGLE AUTO REACT ====================
cmd({
  pattern: "reactall",
  alias: ["autoreact", "autor"],
  react: "🎭",
  desc: "Toggle auto-react for all messages",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const settings = groupSettings.get(from) || {};
    settings.autoReact = !settings.autoReact;
    groupSettings.set(from, settings);

    const status = settings.autoReact ? "ENABLED ✅" : "DISABLED ❌";
    
    await reply(`🎭 *Auto React ${status}*\n\nBot will randomly react to messages with emojis.`);
    
    await bot.sendMessage(from, {
      react: {
        text: settings.autoReact ? "✅" : "❌",
        key: mek.key
      }
    });

  } catch (err) {
    console.error("Reactall error:", err);
    reply("❌ *Failed to toggle!*");
  }
});

// ==================== TOGGLE WELCOME ====================
cmd({
  pattern: "welcome",
  alias: ["welcomemsg", "joinmsg"],
  react: "👋",
  desc: "Toggle welcome messages for new members",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const settings = groupSettings.get(from) || {};
    settings.welcome = !settings.welcome;
    groupSettings.set(from, settings);

    const status = settings.welcome ? "ENABLED ✅" : "DISABLED ❌";
    
    await reply(`👋 *Welcome Messages ${status}*\n\nNew members will ${settings.welcome ? 'receive' : 'not receive'} welcome messages.`);

  } catch (err) {
    reply("❌ *Failed to toggle welcome!*");
  }
});

// ==================== TOGGLE GOODBYE ====================
cmd({
  pattern: "goodbye",
  alias: ["leavemsg", "exitmsg"],
  react: "👋",
  desc: "Toggle goodbye messages for leaving members",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");

    const settings = groupSettings.get(from) || {};
    settings.goodbye = !settings.goodbye;
    groupSettings.set(from, settings);

    const status = settings.goodbye ? "ENABLED ✅" : "DISABLED ❌";
    
    await reply(`👋 *Goodbye Messages ${status}*\n\nLeaving members will ${settings.goodbye ? 'receive' : 'not receive'} goodbye messages.`);

  } catch (err) {
    reply("❌ *Failed to toggle goodbye!*");
  }
});

// ==================== CUSTOM WELCOME MESSAGE ====================
cmd({
  pattern: "setwelcome",
  alias: ["customwelcome", "welcometext"],
  react: "📝",
  desc: "Set custom welcome message",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, isAdmins, reply, from, q }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    if (!isAdmins) return reply("❌ *Admin only!*");
    if (!q) return reply(`❌ *Provide welcome message!*

📌 *Variables:*
• \`{user}\` - Mention new member
• \`{group}\` - Group name  
• \`{count}\` - Member count

📌 *Example:*
\`.setwelcome 👋 Welcome {user} to {group}! You are our {count}th member! 🎉\``);

    const settings = groupSettings.get(from) || {};
    settings.customWelcome = q;
    groupSettings.set(from, settings);

    const preview = q
      .replace(/{user}/g, '@user')
      .replace(/{group}/g, 'Group Name')
      .replace(/{count}/g, '100');

    await reply(`✅ *Custom welcome message set!*\n\n*Preview:*\n${preview}`);

  } catch (err) {
    reply("❌ *Failed to set welcome message!*");
  }
});

// ==================== FUN REACTIONS ====================
cmd({
  pattern: "hug",
  alias: ["cuddle", "hugme"],
  react: "🤗",
  desc: "Hug someone",
  category: "fun",
  filename: __filename,
}, async (bot, mek, m, { isGroup, reply, from, isQuoted, quoted, mentions, sender }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    
    let target;
    if (isQuoted && quoted) {
      target = quoted.sender;
    } else if (mentions && mentions.length > 0) {
      target = mentions[0];
    }
    
    if (!target) return reply("❌ *Tag someone or reply to their message to hug!*\n\nExample: `.hug @9471...`");

    const senderName = sender.split('@')[0];
    const targetName = target.split('@')[0];
    
    await reply(`🤗 *@${senderName} hugs @${targetName}*`, {
      mentions: [sender, target]
    });

    await bot.sendMessage(from, {
      react: { text: "🤗", key: mek.key }
    });

  } catch (err) {
    console.error("Hug error:", err);
    reply("❌ *Failed to send hug!*");
  }
});

cmd({
  pattern: "slap",
  alias: ["hit", "smack"],
  react: "👋",
  desc: "Slap someone (fun)",
  category: "fun",
  filename: __filename,
}, async (bot, mek, m, { isGroup, reply, from, isQuoted, quoted, mentions, sender }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    
    let target;
    if (isQuoted && quoted) {
      target = quoted.sender;
    } else if (mentions && mentions.length > 0) {
      target = mentions[0];
    }
    
    if (!target) return reply("❌ *Tag someone to slap!*\n\nExample: `.slap @9471...`");

    const senderName = sender.split('@')[0];
    const targetName = target.split('@')[0];
    
    const slaps = ["👋", "✋", "💥", "🖐️", "👊"];
    const randomSlap = slaps[Math.floor(Math.random() * slaps.length)];
    
    await reply(`${randomSlap} *@${senderName} slaps @${targetName}*`, {
      mentions: [sender, target]
    });

  } catch (err) {
    console.error("Slap error:", err);
    reply("❌ *Failed!*");
  }
});

cmd({
  pattern: "kiss",
  alias: ["love", "muah"],
  react: "💋",
  desc: "Kiss someone",
  category: "fun",
  filename: __filename,
}, async (bot, mek, m, { isGroup, reply, from, isQuoted, quoted, mentions, sender }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");
    
    let target;
    if (isQuoted && quoted) {
      target = quoted.sender;
    } else if (mentions && mentions.length > 0) {
      target = mentions[0];
    }
    
    if (!target) return reply("❌ *Tag someone to kiss!*\n\nExample: `.kiss @9471...`");

    const senderName = sender.split('@')[0];
    const targetName = target.split('@')[0];
    
    await reply(`💋 *@${senderName} kisses @${targetName}* 😘`, {
      mentions: [sender, target]
    });

    await bot.sendMessage(from, {
      react: { text: "❤️", key: mek.key }
    });

  } catch (err) {
    console.error("Kiss error:", err);
    reply("❌ *Failed!*");
  }
});

// ==================== GROUP STATS ====================
cmd({
  pattern: "groupstats",
  alias: ["gstats", "activity"],
  react: "📊",
  desc: "Show group activity stats",
  category: "group",
  filename: __filename,
}, async (bot, mek, m, { isGroup, reply, from }) => {
  try {
    if (!isGroup) return reply("❌ *Group only!*");

    const metadata = await bot.groupMetadata(from);
    const settings = groupSettings.get(from) || {};

    const stats = `📊 *Group Statistics*

👥 *Total Members:* ${metadata.participants.length}
👑 *Admins:* ${metadata.participants.filter(p => p.admin !== null).length}
📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}

⚙️ *Bot Settings:*
• Auto React: ${settings.autoReact ? '✅ ON' : '❌ OFF'}
• Welcome: ${settings.welcome !== false ? '✅ ON' : '❌ OFF'}
• Goodbye: ${settings.goodbye !== false ? '✅ ON' : '❌ OFF'}
• Custom Welcome: ${settings.customWelcome ? '✅ Set' : '❌ Default'}

> _Vima-MD Group Manager_`;

    await reply(stats);

  } catch (err) {
    console.error("Groupstats error:", err);
    reply("❌ *Failed to get stats!*");
  }
});
