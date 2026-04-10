const { cmd } = require('../command');
const Photo360 = require('abir-photo360-apis');

const effects = {
    naruto: {
        url: 'https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html',
        desc: 'Naruto Shippuden style text effect'
    },
    dragonball: {
        url: 'https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html',
        desc: 'Dragon Ball style text effect'
    },
    onepiece: {
        url: 'https://en.ephoto360.com/create-one-piece-logo-style-text-effect-online-814.html',
        desc: 'One Piece style text effect'
    },
    neon: {
        url: 'https://en.ephoto360.com/write-text-on-3d-neon-sign-board-online-805.html',
        desc: 'Neon text effect'
    },
    fire: {
        url: 'https://en.ephoto360.com/create-burning-fire-text-effect-online-802.html',
        desc: 'Fire text effect'
    },
    ice: {
        url: 'https://en.ephoto360.com/create-ice-text-effect-online-824.html',
        desc: 'Ice text effect'
    },
    gold: {
        url: 'https://en.ephoto360.com/create-golden-metal-text-effect-online-804.html',
        desc: 'Gold text effect'
    }
};


//================== CREATE LOGO FUNCTION ==================
async function createLogo(effectUrl, text) {
    try {
        const generator = new Photo360(effectUrl);
        generator.setName(text);

        const result = await generator.execute();

        if (result.status && result.imageUrl) {
            return {
                success: true,
                imageUrl: result.imageUrl,
                sessionId: result.sessionId
            };
        } else {
            return { success: false };
        }

    } catch (e) {
        console.log("LOGO ERROR:", e);
        return { success: false };
    }
}


//================== MAIN COMMAND ==================
cmd({
    pattern: "logo",
    alias: ["text", "effect"],
    desc: "Create text effects logo",
    category: "ai",
    react: "🎨",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    try {

        if (!q) return reply("❌ Example: .logo fire Vima MD");

        const args = q.split(" ");
        const effectName = args[0].toLowerCase();
        const text = args.slice(1).join(" ");

        if (!effects[effectName]) {
            return reply(
`❌ Invalid effect!

Available:
• naruto
• dragonball
• onepiece
• neon
• fire
• ice
• gold

Example:
.logo fire Vima MD`
            );
        }

        if (!text) return reply("❌ Please provide text\nExample: .logo fire Vima MD");

        reply("🎨 Creating your logo... Please wait");

        const data = await createLogo(effects[effectName].url, text);

        if (!data.success) {
            return reply("❌ Failed to generate logo");
        }

        //================== BEAUTIFUL CAPTION ==================
        const caption =
`╭━━〔 🎨 LOGO READY 〕━━╮

✨ Effect : ${effectName.toUpperCase()}
📝 Text   : ${text}

╭━━〔 🤖 DARK-CYBER-MD 〕━━╮
⚡ Generated Successfully
🚀 Ephoto360 Powered
╰━━━━━━━━━━━━━━━━━━━━╯`;

        await conn.sendMessage(
            from,
            {
                image: { url: data.imageUrl },
                caption
            },
            { quoted: mek }
        );

    } catch (e) {
        console.log("LOGO CMD ERROR:", e);
        reply("❌ Error occurred while generating logo");
    }
});
