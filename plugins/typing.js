const { cmd } = require("../command");
const config = require("../config");

// Auto typing on every message
cmd({
  on: "body"
}, async (conn, mek, m, { from }) => {

  if (config.AUTO_TYPING === "true") {
    try {
      // typing start
      await conn.sendPresenceUpdate('composing', from);

      // stop typing after 2.5 sec
      setTimeout(async () => {
        await conn.sendPresenceUpdate('paused', from);
      }, 2500);

    } catch (e) {
      console.log("AutoTyping Error:", e);
    }
  }

});
