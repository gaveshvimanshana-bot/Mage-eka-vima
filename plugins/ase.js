const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "setprefix",
  desc: "Change bot command prefix",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {

  // owner check (optional but recommended)
  if (!m.sender.includes(config.BOT_OWNER)) {
    return reply("❌ Only owner can use this command!");
  }

  if (!args[0]) return reply("Use: .setprefix <symbol>\nExample: .setprefix !");

  let newPrefix = args[0];

  config.PREFIX = newPrefix;

  reply(`✅ Prefix changed to: ${newPrefix}`);
});
