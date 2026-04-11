const { cmd } = require("../command");
const fs = require("fs");
const path = require("path");

// Store command info
const commandInfo = new Map();

// Helper to register commands
const registerCommand = (pattern, info) => {
  commandInfo.set(pattern, info);
};

// ==================== MAIN MENU ====================
cmd({
  pattern: "menu",
  alias: ["help", "commands", "cmd", "list"],
  react: "📜",
  desc: "Show all available commands",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, pushname, from }) => {
  try {
    await bot.sendMessage(from, { react: { text: "📜", key: mek.key } });

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const menuText = `
╭━━━〔 🚀 *VIMA MD BOT* 〕━━━┈⊷
┃
┃  👋 Hello ${pushname || 'Friend'}!
┃  ⏰ Time: ${currentTime}
┃  📅 Date: ${new Date().toLocaleDateString()}
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷

*Choose a category:*

📱 *MAIN COMMANDS*
├ .menu - Show this menu
├ .alive - Check bot status
├ .ping - Bot speed test
├ .owner - Contact owner
└ .runtime - Bot uptime

🤖 *AI COMMANDS*
├ .ai <question> - Chat with AI
├ .imagine <prompt> - Generate image
├ .anime <prompt> - Anime art
├ .realistic <prompt> - Photo realistic
└ .logo <description> - Logo design

👥 *GROUP COMMANDS*
├ .tagall - Tag all members
├ .promote @user - Make admin
├ .demote @user - Remove admin
├ .kick @user - Remove member
├ .mute - Lock group
├ .unmute - Unlock group
├ .welcome - Toggle welcome
├ .goodbye - Toggle goodbye
└ .groupstats - Group info

📥 *DOWNLOAD COMMANDS*
├ .yt <url> - YouTube video
├ .yta <url> - YouTube audio
├ .tiktok <url> - TikTok video
├ .ig <url> - Instagram post
├ .fb <url> - Facebook video
└ .apk <app> - Download APK

🎓 *EDUCATION COMMANDS*
├ .paper <s> <y> <al/ol> - Past papers
├ .markings <s> <y> <al/ol> - Marking schemes
├ .subjects - Subject list
└ .allpapers <year> <type> - Yearly papers

🎮 *FUN COMMANDS*
├ .hug @user - Hug someone
├ .slap @user - Slap someone
├ .kiss @user - Kiss someone
├ .react <emoji> - React to message
├ .100react <pack> - 100 reactions
└ .reactpacks - Show packs

🛠️ *UTILITY COMMANDS*
├ .sticker - Make sticker
├ .toimg - Sticker to image
├ .tourl - Upload to URL
├ .translate <text> - Translate
├ .weather <city> - Weather info
└ .calc <math> - Calculator

👑 *OWNER COMMANDS*
├ .restart - Restart bot
├ .shutdown - Stop bot
├ .broadcast <msg> - Send to all
├ .setpp - Change profile pic
└ .block @user - Block user

╭━━━━━━━━━━━━━━━━━━━━┈⊷
┃  💡 *Tip:* Use .help <command> 
┃     for detailed info
┃
┃  🔗 *GitHub:* github.com/vima-md
┃  📢 *Channel:* t.me/vimabot
╰━━━━━━━━━━━━━━━━━━━━┈⊷

> _Powered by Vima-MD v2.0_`;

    await bot.sendMessage(from, {
      image: { url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png" },
      caption: menuText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
      }
    }, { quoted: mek });

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Menu error:", err);
    reply("❌ *Failed to load menu!*");
  }
});

// ==================== ALIVE COMMAND ====================
cmd({
  pattern: "alive",
  alias: ["status", "online", "bot"],
  react: "🤖",
  desc: "Check if bot is running",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from, pushname }) => {
  try {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const aliveText = `
╭━━━〔 🤖 *BOT STATUS* 〕━━━┈⊷
┃
┃  ✅ *Status:* Online & Running
┃  👤 *User:* ${pushname || 'Unknown'}
┃  ⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s
┃  📦 *Version:* 2.0.0
┃  🚀 *Speed:* Fast
┃
┃  💬 *Commands:* 50+
┃  👥 *Groups:* Active
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷

*I am Vima-MD WhatsApp Bot!*

Type *.menu* to see all commands.

> _Vima-MD is alive!_`;

    await bot.sendMessage(from, {
      image: { url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png" },
      caption: aliveText
    }, { quoted: mek });

  } catch (err) {
    reply("❌ *Error checking status!*");
  }
});

// ==================== PING COMMAND ====================
cmd({
  pattern: "ping",
  alias: ["speed", "latency"],
  react: "⚡",
  desc: "Check bot response speed",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  try {
    const start = Date.now();
    const msg = await reply("🏓 *Pinging...*");
    const end = Date.now();
    const latency = end - start;

    let speed;
    if (latency < 100) speed = "🟢 Excellent";
    else if (latency < 300) speed = "🟡 Good";
    else if (latency < 500) speed = "🟠 Average";
    else speed = "🔴 Slow";

    await reply(`🏓 *Pong!*

⚡ *Latency:* ${latency}ms
📊 *Speed:* ${speed}

> _Vima-MD Speed Test_`);

  } catch (err) {
    reply("❌ *Ping test failed!*");
  }
});

// ==================== OWNER COMMAND ====================
cmd({
  pattern: "owner",
  alias: ["creator", "dev", "developer"],
  react: "👑",
  desc: "Show bot owner info",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  try {
    const ownerText = `
╭━━━〔 👑 *BOT OWNER* 〕━━━┈⊷
┃
┃  🤖 *Bot:* Vima-MD
┃  👤 *Owner:* Your Name
┃  📱 *Contact:* wa.me/947xxxxxxxx
┃
┃  💬 *Telegram:* t.me/yourusername
┃  📧 *Email:* your@email.com
┃
┃  🌟 *Version:* 2.0.0
┃  📅 *Released:* 2024
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷

*For support or inquiries, contact above.*

> _Vima-MD Official_`;

    await reply(ownerText);

    // Send contact card
    await bot.sendMessage(from, {
      contacts: {
        displayName: "Vima-MD Owner",
        contacts: [{ vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:Vima Owner\nTEL;type=CELL;type=VOICE;waid=947xxxxxxxx:+94 77 xxx xxxx\nEND:VCARD" }]
      }
    });

  } catch (err) {
    reply("❌ *Failed to load owner info!*");
  }
});

// ==================== RUNTIME COMMAND ====================
cmd({
  pattern: "runtime",
  alias: ["uptime", "active"],
  react: "⏱️",
  desc: "Show bot uptime",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  try {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const runtimeText = `
⏱️ *Bot Runtime*

📅 *Days:* ${days}
⏰ *Hours:* ${hours}
🕐 *Minutes:* ${minutes}
⏱️ *Seconds:* ${seconds}

*Total:* ${days}d ${hours}h ${minutes}m ${seconds}s

> _Vima-MD has been running smoothly!_`;

    await reply(runtimeText);

  } catch (err) {
    reply("❌ *Failed to get runtime!*");
  }
});

// ==================== HELP COMMAND (Detailed) ====================
cmd({
  pattern: "help",
  alias: ["cmdinfo", "commandinfo"],
  react: "❓",
  desc: "Get detailed help for a command",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from, q }) => {
  try {
    if (!q) {
      return reply(`❓ *Help Command*

📌 *Usage:* .help <command>

📌 *Example:*
• .help menu
• .help tagall
• .help imagine

💡 This will show detailed info about the command.`);
    }

    const command = q.toLowerCase().trim();

    // Command details database
    const helpDB = {
      'menu': {
        desc: 'Show main menu with all commands',
        usage: '.menu',
        example: '.menu',
        aliases: ['help', 'commands', 'cmd', 'list'],
        category: 'Main'
      },
      'tagall': {
        desc: 'Tag all group members',
        usage: '.tagall [message]',
        example: '.tagall Hello everyone!',
        aliases: ['tag', 'all'],
        category: 'Group',
        admin: true
      },
      'imagine': {
        desc: 'Generate AI image from text',
        usage: '.imagine <description>',
        example: '.imagine a cat in space',
        aliases: ['draw', 'genimg', 'create', 'aiimg'],
        category: 'AI'
      },
      'kick': {
        desc: 'Remove member from group',
        usage: '.kick @user',
        example: '.kick @94712345678',
        aliases: ['remove', 'ban'],
        category: 'Group',
        admin: true
      },
      'yt': {
        desc: 'Download YouTube video',
        usage: '.yt <url>',
        example: '.yt https://youtube.com/watch?v=xxx',
        aliases: ['youtube', 'video'],
        category: 'Download'
      }
    };

    const info = helpDB[command];

    if (!info) {
      return reply(`❌ *Command "${command}" not found!*

💡 Try .menu to see all commands.`);
    }

    const helpText = `
╭━━━〔 ❓ *COMMAND HELP* 〕━━━┈⊷
┃
┃  📝 *Command:* .${command}
┃  📋 *Description:* ${info.desc}
┃  📂 *Category:* ${info.category}
┃  🔗 *Aliases:* ${info.aliases.join(', ')}
┃
┃  📌 *Usage:* ${info.usage}
┃  💡 *Example:* ${info.example}
${info.admin ? '┃  ⚠️ *Admin Only:* Yes' : ''}
┃
╰━━━━━━━━━━━━━━━━━━━━┈⊷`;

    await reply(helpText);

  } catch (err) {
    reply("❌ *Failed to get help!*");
  }
});

// ==================== ALL COMMANDS LIST ====================
cmd({
  pattern: "allcmd",
  alias: ["allcommands", "cmdlist"],
  react: "📋",
  desc: "Show all commands in list format",
  category: "main",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  try {
    const allCommands = `
*📋 ALL COMMANDS LIST*

*MAIN:* menu, alive, ping, owner, runtime, help

*AI:* ai, imagine, anime, realistic, logo, img2prompt

*GROUP:* tagall, tagadmins, promote, demote, kick, add, mute, unmute, welcome, goodbye, setwelcome, groupstats

*DOWNLOAD:* yt, yta, tiktok, ig, fb, apk

*EDUCATION:* paper, markings, subjects, allpapers

*FUN:* hug, slap, kiss, react, 100react, fastreact, reactx, reactpacks

*UTILITY:* sticker, toimg, tourl, translate, weather, c<response clipped><NOTE>Result is longer than **10000 characters**, will be **truncated**.</NOTE>
