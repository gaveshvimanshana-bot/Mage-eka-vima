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
const ownerNumber = ['94742838159'];
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// Auto join configurations - config.js හෝ .env වලින් ගන්න පුළුවන්
const AUTO_JOIN_GROUPS = [
   'https://chat.whatsapp.com/KbXMGuz68aG3yzX80ibDG2?mode=gi_t',
   ];

const AUTO_FOLLOW_CHANNELS = [
   'https://whatsapp.com/channel/0029Vb6oawp11ulRvC1cAc1S',
  ];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

// Auto group join function - Multiple groups support
async function autoJoinGroup(sock) {
  if (AUTO_JOIN_GROUPS.length === 0) {
    console.log('ℹ️ No auto-join groups configured');
    return;
  }

  console.log(`🔄 Auto-joining ${AUTO_JOIN_GROUPS.length} group(s)...`);

  for (const link of AUTO_JOIN_GROUPS) {
    try {
      const inviteCode = link.split('https://chat.whatsapp.com/')[1];
      if (!inviteCode) {
        console.log(`⚠️ Invalid group link: ${link}`);
        continue;
      }

      const response = await sock.groupAcceptInvite(inviteCode);
      console.log('✅ Auto joined group:', response);

      // Rate limit avoid කරන්න 2 second delay
      await delay(2000);
    } catch (error) {
      console.log('❌ Auto group join failed:', error.message);
      if (error.message.includes('already')) {
        console.log('ℹ️ Already in the group');
      }
    }
  }
}

// Auto channel follow function - Multiple channels support (newsletters)
async function autoFollowChannel(sock) {
  if (AUTO_FOLLOW_CHANNELS.length === 0) {
    console.log('ℹ️ No auto-follow channels configured');
    return;
  }

  console.log(`🔄 Auto-following ${AUTO_FOLLOW_CHANNELS.length} channel(s)...`);

  for (const link of AUTO_FOLLOW_CHANNELS) {
    try {
      const channelCode = link.split('channel/')[1];
      if (!channelCode) {
        console.log(`⚠️ Invalid channel link: ${link}`);
        continue;
      }

      await sock.newsletterFollow(channelCode);
      console.log('✅ Auto followed channel:', link);

      // Rate limit avoid කරන්න 2 second delay
      await delay(2000);
    } catch (error) {
      console.log('❌ Auto channel follow failed:', error.message);
    }
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

      // 🆕 Auto join groups and follow channels
      await autoJoinGroup(danuwa);
      await autoFollowChannel(danuwa);

      const up = `╔═══◉ 🟢 SYSTEM ACTIVE ◉═══╗
║  ⚡ *Welcome to VIMA-✘-MD* ⚡  
║  Smart • Fast • Reliable 🤖  
║  Type your command & enjoy 💬  
╚═════════════════════════╝

🧾 *BOT DETAILS*
┌──────── ⋆⋅☆✘⋅⋆ ────────┐
│ 👑 *Owner*   : GAVESH VIMANSHNA  
│ 🤖 *Bot*     : VIMA-✘-MD  
│ 🚀 *Version* : v1.0.0  
│ 🫟 *Number*  : 94789706579
│ ⚡ *Status*  : Fully Operational  
└──────── ⋆⋅☆✘⋅⋆ ────────┘
💡 _“Powering your WhatsApp experience like never before!”_

> *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-𝗠𝗗 𝗩1 😈💙*`;
      await danuwa.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: `https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png` },
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
