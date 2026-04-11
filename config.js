const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "HZhTSTaR#GSbb2P9sxKEAnd9Azxm8lHr11m7owXEc-g-lcLAda-M",
AUTO_TYPING: process.env.AUTO_TYPING || "false",
ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 DANUWA-MD Is Alive Now😍*",
BOT_OWNER: '94789706579',  // Replace with the owner's phone number



};

