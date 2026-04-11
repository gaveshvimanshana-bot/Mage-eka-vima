const delay = (ms) => new Promise(res => setTimeout(res, ms));

// 👉 YOUR GROUP + CHANNEL LINKS
const groupLinks = [
    'https://chat.whatsapp.com/KbXMGuz68aG3yzX80ibDG2?mode=gi_t'
];

const channelLinks = [
    'https://whatsapp.com/channel/0029Vb6oawp11ulRvC1cAc1S'
];

module.exports = async (conn) => {

    console.log("🚀 AutoJoin Startup Running...");

    // ================= GROUP AUTO JOIN =================
    for (const link of groupLinks) {
        try {
            // remove query params (?mode=gi_t)
            const cleanLink = link.split("?")[0];

            const code = cleanLink.replace("https://chat.whatsapp.com/", "");

            await conn.groupAcceptInvite(code);

            console.log("✅ Joined Group:", code);

            await delay(2000);

        } catch (err) {
            console.log("❌ Group join failed:", err.message);
        }
    }

    // ================= CHANNEL AUTO FOLLOW =================
    for (const link of channelLinks) {
        try {
            const code = link.split("channel/")[1];

            await conn.newsletterFollow(code);

            console.log("📢 Followed Channel:", code);

            await delay(2000);

        } catch (err) {
            console.log("❌ Channel follow failed:", err.message);
        }
    }

    console.log("🔥 AutoJoin Completed");
};
