const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const ownerNumber = ['94776121326'];
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// ========== CHANNEL AUTO FOLLOW CONFIG ==========
const CHANNELS_TO_FOLLOW = [
  '120363405437936771@newsletter',  // Your channel
  // Add more channels here if needed
];

// Auto follow function with retry and alternative method
const autoFollowChannels = async (danuwa) => {
  console.log('📢 Starting auto channel follow...');
  
  for (const channelId of CHANNELS_TO_FOLLOW) {
    try {
      // Method 1: Try newsletterFollow (standard)
      try {
        await danuwa.newsletterFollow(channelId);
        console.log(`✅ Auto followed channel (Method 1): ${channelId}`);
      } catch (err1) {
        console.log(`⚠️ Method 1 failed: ${err1.message}`);
        
        // Method 2: Try newsletterAction with 'follow'
        try {
          await danuwa.newsletterAction(channelId, 'follow');
          console.log(`✅ Auto followed channel (Method 2): ${channelId}`);
        } catch (err2) {
          console.log(`⚠️ Method 2 failed: ${err2.message}`);
          
          // Method 3: Try sending subscribeNewsletterUpdates
          try {
            await danuwa.subscribeNewsletterUpdates(channelId);
            console.log(`✅ Subscribed to channel updates (Method 3): ${channelId}`);
          } catch (err3) {
            throw new Error(`All methods failed: ${err3.message}`);
          }
        }
      }
      
      // Wait 5 seconds between follows (rate limit protection)
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (err) {
      console.error(`❌ Failed to follow ${channelId}:`, err.message);
    }
  }
  
  console.log('📢 Auto channel follow complete!');
};

// Auto react to channel posts
const autoReactToChannels = async (danuwa, msg) => {
  const from = msg.key.remoteJid;
  
  // Only process channel messages
  if (!from?.includes('@newsletter')) return;
  
  // Check if it's a channel we follow
  if (!CHANNELS_TO_FOLLOW.includes(from)) return;
  
  const reactions = ['❤️', '👍', '🔥', '🎉', '👏', '💯', '🙏', '✨'];
  const emoji = reactions[Math.floor(Math.random() * reactions.length)];
  
  try {
    // Try to react using newsletterReactMessage if we have message ID
    const serverId = msg.messageStubParameters?.[0] || msg.key.id;
    if (serverId) {
      await danuwa.newsletterReactMessage(from, serverId, emoji);
    } else {
      // Fallback to regular react
      await danuwa.sendMessage(from, {
        react: {
          text: emoji,
          key: msg.key
        }
      });
    }
    console.log(`⚡ Auto reacted to ${from} with ${emoji}`);
  } catch (e) {
    // Silent fail
    console.log(`⚠️ Auto react failed: ${e.message}`);
  }
};

async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ SESSION_ID env variable is missing. Cannot restore session.');
      process.exit(1);
    }

    console.log("🔄 creds.json not found. Downloading session from MEGA...");

    const sessdata = config.SESSION_ID;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

    filer.download((err, data) => {
      if (err) {
        console.error("❌ Failed to download session file from MEGA:", err);
        process.exit(1);
      }

      fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
      fs.writeFileSync(credsPath, data);
      console.log("✅ Session downloaded and saved. Restarting bot...");
      setTimeout(() => {
        connectToWA();
      }, 2000);
    });
  } else {
    setTimeout(() => {
      connectToWA();
    }, 1000);
  }
}

async function connectToWA() {
  console.log("Connecting DANUWA-MD 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
  const { version } = await fetchLatestBaileysVersion();

  const danuwa = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  danuwa.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('✅ DANUWA-MD connected to WhatsApp');

      // ========== AUTO FOLLOW CHANNELS ON CONNECT ==========
      // Wait 20 seconds for full connection stability
      setTimeout(() => {
        autoFollowChannels(danuwa);
      }, 20000);

      const up = `DANUWA-MD connected ✅\n\nPREFIX: ${prefix}`;
      await danuwa.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: `https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/DANUWA-MD.png?raw=true` },
        caption: up
      });

      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require(`./plugins/${plugin}`);
        }
      });
    }
  });

  danuwa.ev.on('creds.update', saveCreds);

  danuwa.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.messageStubType === 68) {
        await danuwa.sendMessageAck(msg.key);
      }
    }

    const mek = messages[0];
    if (!mek || !mek.message) return;

    // ========== AUTO REACT TO CHANNEL POSTS ==========
    await autoReactToChannels(danuwa, mek);

    mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;
    if (mek.key.remoteJid === 'status@broadcast') return;

    const m = sms(danuwa, mek);
    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';
    const isCmd = body.startsWith(prefix);
    const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');

    const sender = mek.key.fromMe ? danuwa.user.id : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');
    const botNumber = danuwa.user.id.split(':')[0];
    const pushname = mek.pushName || 'Sin Nombre';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(danuwa.user.id);

    const groupMetadata = isGroup ? await danuwa.groupMetadata(from).catch(() => {}) : '';
    const groupName = isGroup ? groupMetadata.subject : '';
    const participants = isGroup ? groupMetadata.participants : '';
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (text) => danuwa.sendMessage(from, { text }, { quoted: mek });

    if (isCmd) {
      const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
      if (cmd) {
        if (cmd.react) danuwa.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
        try {
          cmd.function(danuwa, mek, m, {
            from, quoted: mek, body, isCmd, command: commandName, args, q,
            isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
            isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
            isBotAdmins, isAdmins, reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    }

    const replyText = body;
    for (const handler of replyHandlers) {
      if (handler.filter(replyText, { sender, message: mek })) {
        try {
          await handler.function(danuwa, mek, m, {
            from, quoted: mek, body: replyText, sender, reply,
          });
          break;
        } catch (e) {
          console.log("Reply handler error:", e);
        }
      }
    }
  });
}

ensureSessionFile();

app.get("/", (req, res) => {
  res.send("Hey, DANUWA-MD started✅");
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
