const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');

//================== ALIVE ==================
cmd({
    pattern: "alive",
    desc: "Check bot online",
    category: "main",
    react: "👋",
    filename: __filename
}, async(conn, mek, m, {from, pushname, reply}) => {
    try {

        let msg = `
👋 Hi ${pushname}
🤖 *DARK-CYBER-MD ONLINE*

⏳ Uptime: ${runtime(process.uptime())}
👑 Owner: ${config.OWNER_NAME || "Unknown"}
⚙️ Version: ${config.VERSION || "1.0.0"}
`;

        await conn.sendMessage(from, {
            image: { url: config.ALIVE_IMG || 'https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png' },
            caption: msg
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Error");
    }
});


//================== PING ==================
cmd({
    pattern: "ping",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        const m1 = await conn.sendMessage(from, { text: 'Pinging...' });
        const ping = Date.now() - start;

        await conn.sendMessage(from, {
            text: `⚡ Pong: ${ping}ms`
        }, { quoted: m1 });

    } catch {
        reply("Error");
    }
});


//================== SYSTEM ==================
cmd({
    pattern: "system",
    category: "main",
    react: "🔥",
    filename: __filename
}, async(conn, mek, m, { from, reply }) => {
    try {

        let total = (os.totalmem()/1073741824).toFixed(2);
        let free = (os.freemem()/1073741824).toFixed(2);
        let used = (total - free).toFixed(2);

        let sys = `
💻 *SYSTEM INFO*

🖥 Platform: ${os.platform()}
⚙ CPU Cores: ${os.cpus().length}
📦 RAM Used: ${used}/${total} GB
⏳ Uptime: ${runtime(process.uptime())}
`;

        await conn.sendMessage(from, { text: sys }, { quoted: mek });

    } catch {
        reply("Error");
    }
});


//================== MENU ==================
cmd({
    pattern: "menu",
    category: "main",
    react: "📜",
    filename: __filename
}, async(conn, mek, m, { from, pushname, reply }) => {
    try {

        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();

        let menu = {
            main:'', download:'', group:'', owner:'',
            convert:'', ai:'', tools:'', search:'',
            fun:'', voice:'', other:''
        };

        for (let c of commands) {
            if (c.pattern && !c.dontAddCommandList) {
                if (menu[c.category] !== undefined) {
                    menu[c.category] += `▢ ${c.pattern}\n`;
                }
            }
        }

        let txt = `
╔════════════════════╗
║ 🤖 *DARK-CYBER-MD*
╚════════════════════╝

👤 Name   : ${pushname}
📅 Date   : ${date}
⏰ Time   : ${time}
👑 Owner  : ${config.OWNER_NAME || "Mr Owner"}
⚙️ Version: ${config.VERSION || "1.0.0"}

╔════════════════════╗
║ 📜 COMMAND LIST
╚════════════════════╝

🔰 MAIN
${menu.main}

👥 GROUP
${menu.group}

📥 DOWNLOAD
${menu.download}

🤖 AI
${menu.ai}

🧰 TOOLS
${menu.tools}

🎮 FUN
${menu.fun}

📌 OTHER
${menu.other}

╔════════════════════╗
║ ⚡ DARK-CYBER-MD ⚡
╚════════════════════╝
`;

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMG || 'https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png' },
            caption: txt
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ Error");
    }
});


//================== GROUP COMMANDS ==================

// KICK
cmd({
    pattern: "kick",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, quoted, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins && !isOwner) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let user = quoted ? quoted.sender : m.mentionedJid[0];
    if (!user) return reply("Reply or tag user");

    await conn.groupParticipantsUpdate(from, [user], "remove");
    reply("✅ Kicked");
});


// ADD
cmd({
    pattern: "add",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, args, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    if (!args[0]) return reply("Give number");

    let num = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await conn.groupParticipantsUpdate(from, [num], "add");
    reply("✅ Added");
});


// PROMOTE
cmd({
    pattern: "promote",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, quoted, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let user = quoted ? quoted.sender : m.mentionedJid[0];
    if (!user) return reply("Reply or tag user");

    await conn.groupParticipantsUpdate(from, [user], "promote");
    reply("✅ Promoted");
});


// DEMOTE
cmd({
    pattern: "demote",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, quoted, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let user = quoted ? quoted.sender : m.mentionedJid[0];
    if (!user) return reply("Reply or tag user");

    await conn.groupParticipantsUpdate(from, [user], "demote");
    reply("✅ Demoted");
});
