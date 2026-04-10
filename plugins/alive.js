const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');

//================== ALIVE ==================
cmd({
    pattern: "alive",
    desc: "Check bot online",
    category: "main",
    filename: __filename
}, async(conn, mek, m, {from, pushname, reply}) => {
    try {
        let msg = `
👋 Hi ${pushname}
✨ DARK-CYBER-MD Online

⏳ Uptime: ${runtime(process.uptime())}
🛠 Owner: Mr Hashuwh`;

        await conn.sendMessage(from, {
            image: { url: 'https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png' },
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
        await conn.sendMessage(from, { text: `⚡ ${ping}ms` }, { quoted: m1 });
    } catch {
        reply("Error");
    }
});

//================== SYSTEM ==================
cmd({
    pattern: "system",
    category: "main",
    react: "💻",
    filename: __filename
}, async(conn, mek, m, { from, reply }) => {
    try {
        let total = (os.totalmem()/1073741824).toFixed(2);
        let free = (os.freemem()/1073741824).toFixed(2);
        let used = (total - free).toFixed(2);

        let sys = `
💻 SYSTEM
OS: ${os.platform()}
CPU: ${os.cpus().length}
RAM: ${used}/${total} GB
UPTIME: ${runtime(process.uptime())}`;

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
        let menu = {
            main:'', download:'', group:'', owner:'',
            convert:'', ai:'', tools:'', search:'',
            fun:'', voice:'', other:''
        };

        for (let c of commands) {
            if (c.pattern && !c.dontAddCommandList) {
                menu[c.category] += `.${c.pattern}\n`;
            }
        }

        let txt = `
👋 Hello ${pushname}

⏳ ${runtime(process.uptime())}

🔧 Main
${menu.main}

👥 Group
${menu.group}

📥 Download
${menu.download}

> VIMA-MD`;

        await conn.sendMessage(from, {
            image: { url: 'https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png' },
            caption: txt
        }, { quoted: mek });

    } catch {
        reply("Error");
    }
});

//================== GROUP ==================

// Kick
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
    reply("✅ Done");
});

// Add
cmd({
    pattern: "add",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, args, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins && !isOwner) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let num = args[0]?.replace(/[^0-9]/g,"") + "@s.whatsapp.net";
    if (!args[0]) return reply("Give number");

    await conn.groupParticipantsUpdate(from, [num], "add");
    reply("✅ Added");
});

// Promote
cmd({
    pattern: "promote",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, quoted, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins && !isOwner) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let user = quoted ? quoted.sender : m.mentionedJid[0];
    if (!user) return reply("Reply or tag");

    await conn.groupParticipantsUpdate(from, [user], "promote");
    reply("✅ Promoted");
});

// Demote
cmd({
    pattern: "demote",
    category: "group",
    filename: __filename
}, async(conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, quoted, reply }) => {

    if (!isGroup) return reply("Group only");
    if (!isAdmins && !isOwner) return reply("Admin only");
    if (!isBotAdmins) return reply("Bot not admin");

    let user = quoted ? quoted.sender : m.mentionedJid[0];
    if (!user) return reply("Reply or tag");

    await conn.groupParticipantsUpdate(from, [user], "demote");
    reply("✅ Demoted");
});
