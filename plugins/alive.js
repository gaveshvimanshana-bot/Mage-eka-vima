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
🤖 *𝗩𝗜𝗠𝗔-✘-𝗠𝗗 𝗔𝗟𝗜𝗩𝗘 𝗡𝗢𝗪*

⏳ Uptime: ${runtime(process.uptime())}
👑 Owner: ＭＲ ＧＡＶＥＳＨ
⚙️ Version: ${config.VERSION || "1.0.0"}
> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-𝗠𝗗 𝗩1 💐💙*
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
    react: "💻",
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
            main:'', download:'', owner:'',
            convert:'', ai:'', group:'', search:'',
            fun:'', voice:'', owner:''
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
║ 🤖 *VIMA-✘-MD*🔥
╚════════════════════╝

👤 Name   : ${pushname}
📅 Date   : ${date}
⏰ Time   : ${time}
👑 Owner  : ${config.OWNER_NAME || "ＭＲ ＧＡＶＥＳＨ"}
⚙️ Version: ${config.VERSION || "1.0.0"}

╔════════════════════╗
║ 📜 COMMAND LIST 🫟
╚════════════════════╝

🔰 MAIN
${menu.main}

📥 DOWNLOAD
${menu.download}

🤖 AI
${menu.ai}

🧰 group
${menu.group}

🎮 FUN
${menu.fun}

📌 OTHER
${menu.other}

╔════════════════════╗
> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-𝗠𝗗 𝗩 1 💐💙*
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
