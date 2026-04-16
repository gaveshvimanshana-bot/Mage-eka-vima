
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const FileType = require('file-type');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
// Set the path for fluent-ffmpeg to find the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  getContentType,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
  downloadContentFromMessage,
  DisconnectReason
} = require('baileyz');
const { title } = require('process');

// ---------------- CONFIG ----------------

const BOT_NAME_FANCY = 'FREE HOSTING BOT';


const config = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://gaveshvimanshana1234_db_user:LGL5sWMX9VrJmOuE@cluster0.orslfxw.mongodb.net/',
  SESSION_ID: process.env.SESSION_ID || '', // your session id or catbox url
  CREDS_JSON: process.env.CREDS_JSON || '', // your raw creds.json content
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  AUTO_LIKE_EMOJI: ['💙', '🩷', '💜', '🤎', '🧡', '🩵', '💛', '🩶', '♥️', '💗', '❤️‍🔥'],
  PREFIX: '.',
  MAX_RETRIES: 3,
  GROUP_INVITE_LINK: 'https://chat.whatsapp.com/HvkKugCbZxe6yt6hlo1OCD?mode=gi_t',
  RCD_IMAGE_PATH: 'https://cloud.laksidunimsara.com/f/Gavesh/1776071493689-file_00000000701071fa87d20f48721f618c.png',
  NEWSLETTER_JID: '1201234567890@newsletter',
  OTP_EXPIRY: 300000,
  OWNER_NUMBER: process.env.OWNER_NUMBER || '94742838159',
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb6oawp11ulRvC1cAc1S',
  BOT_NAME: 'VIMA MD BOT',
  BOT_VERSION: '1.0.0V',
  OWNER_NAME: 'GAVESH VIMANSHANA',
  IMAGE_PATH: 'https://cloud.laksidunimsara.com/f/Gavesh/1776071493689-file_00000000701071fa87d20f48721f618c.png',
  BOT_FOOTER: '> *VIMA MD BOT*',
  BUTTON_IMAGES: { ALIVE: 'https://cloud.laksidunimsara.com/f/Gavesh/1776071493689-file_00000000701071fa87d20f48721f618c.png' }

};

// ---------------- MONGO SETUP ----------------

const MONGO_URI = config.MONGO_URI;

const MONGO_DB = process.env.MONGO_DB || 'FREE';

let mongoClient, mongoDB;
let sessionsCol, numbersCol, adminsCol, newsletterCol, configsCol, newsletterReactsCol;

async function initMongo() {
  try {
    if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected && mongoClient.topology.isConnected()) return;
  } catch (e) { }
  mongoClient = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await mongoClient.connect();
  mongoDB = mongoClient.db(MONGO_DB);

  sessionsCol = mongoDB.collection('sessions');
  numbersCol = mongoDB.collection('numbers');
  adminsCol = mongoDB.collection('admins');
  newsletterCol = mongoDB.collection('newsletter_list');
  configsCol = mongoDB.collection('configs');
  newsletterReactsCol = mongoDB.collection('newsletter_reacts');

  await sessionsCol.createIndex({ number: 1 }, { unique: true });
  await numbersCol.createIndex({ number: 1 }, { unique: true });
  await newsletterCol.createIndex({ jid: 1 }, { unique: true });
  await newsletterReactsCol.createIndex({ jid: 1 }, { unique: true });
  await configsCol.createIndex({ number: 1 }, { unique: true });
  console.log('✅ Mongo initialized and collections ready');
}

// ---------------- Mongo helpers ----------------

async function saveCredsToMongo(number, creds, keys = null) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    const doc = { number: sanitized, creds, keys, updatedAt: new Date() };
    await sessionsCol.updateOne({ number: sanitized }, { $set: doc }, { upsert: true });
    console.log(`Saved creds to Mongo for ${sanitized}`);
  } catch (e) { console.error('saveCredsToMongo error:', e); }
}

async function loadCredsFromMongo(number) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    const doc = await sessionsCol.findOne({ number: sanitized });
    return doc || null;
  } catch (e) { console.error('loadCredsFromMongo error:', e); return null; }
}

async function removeSessionFromMongo(number) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await sessionsCol.deleteOne({ number: sanitized });
    console.log(`Removed session from Mongo for ${sanitized}`);
  } catch (e) { console.error('removeSessionToMongo error:', e); }
}

async function addNumberToMongo(number) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await numbersCol.updateOne({ number: sanitized }, { $set: { number: sanitized } }, { upsert: true });
    console.log(`Added number ${sanitized} to Mongo numbers`);
  } catch (e) { console.error('addNumberToMongo', e); }
}

async function removeNumberFromMongo(number) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await numbersCol.deleteOne({ number: sanitized });
    console.log(`Removed number ${sanitized} from Mongo numbers`);
  } catch (e) { console.error('removeNumberFromMongo', e); }
}

async function getAllNumbersFromMongo() {
  try {
    await initMongo();
    const docs = await numbersCol.find({}).toArray();
    return docs.map(d => d.number);
  } catch (e) { console.error('getAllNumbersFromMongo', e); return []; }
}

async function loadAdminsFromMongo() {
  try {
    await initMongo();
    const docs = await adminsCol.find({}).toArray();
    return docs.map(d => d.jid || d.number).filter(Boolean);
  } catch (e) { console.error('loadAdminsFromMongo', e); return []; }
}

async function addAdminToMongo(jidOrNumber) {
  try {
    await initMongo();
    const doc = { jid: jidOrNumber };
    await adminsCol.updateOne({ jid: jidOrNumber }, { $set: doc }, { upsert: true });
    console.log(`Added admin ${jidOrNumber}`);
  } catch (e) { console.error('addAdminToMongo', e); }
}

async function removeAdminFromMongo(jidOrNumber) {
  try {
    await initMongo();
    await adminsCol.deleteOne({ jid: jidOrNumber });
    console.log(`Removed admin ${jidOrNumber}`);
  } catch (e) { console.error('removeAdminFromMongo', e); }
}

async function addNewsletterToMongo(jid, emojis = []) {
  try {
    await initMongo();
    const doc = { jid, emojis: Array.isArray(emojis) ? emojis : [], addedAt: new Date() };
    await newsletterCol.updateOne({ jid }, { $set: doc }, { upsert: true });
    console.log(`Added newsletter ${jid} -> emojis: ${doc.emojis.join(',')}`);
  } catch (e) { console.error('addNewsletterToMongo', e); throw e; }
}

async function removeNewsletterFromMongo(jid) {
  try {
    await initMongo();
    await newsletterCol.deleteOne({ jid });
    console.log(`Removed newsletter ${jid}`);
  } catch (e) { console.error('removeNewsletterFromMongo', e); throw e; }
}

async function listNewslettersFromMongo() {
  try {
    await initMongo();
    const docs = await newsletterCol.find({}).toArray();
    return docs.map(d => ({ jid: d.jid, emojis: Array.isArray(d.emojis) ? d.emojis : [] }));
  } catch (e) { console.error('listNewslettersFromMongo', e); return []; }
}

async function saveNewsletterReaction(jid, messageId, emoji, sessionNumber) {
  try {
    await initMongo();
    const doc = { jid, messageId, emoji, sessionNumber, ts: new Date() };
    if (!mongoDB) await initMongo();
    const col = mongoDB.collection('newsletter_reactions_log');
    await col.insertOne(doc);
    console.log(`Saved reaction ${emoji} for ${jid}#${messageId}`);
  } catch (e) { console.error('saveNewsletterReaction', e); }
}

async function setUserConfigInMongo(number, conf) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    await configsCol.updateOne({ number: sanitized }, { $set: { number: sanitized, config: conf, updatedAt: new Date() } }, { upsert: true });
  } catch (e) { console.error('setUserConfigInMongo', e); }
}

async function loadUserConfigFromMongo(number) {
  try {
    await initMongo();
    const sanitized = number.replace(/[^0-9]/g, '');
    const doc = await configsCol.findOne({ number: sanitized });
    return doc ? doc.config : null;
  } catch (e) { console.error('loadUserConfigFromMongo', e); return null; }
}

// -------------- newsletter react-config helpers --------------

async function addNewsletterReactConfig(jid, emojis = []) {
  try {
    await initMongo();
    await newsletterReactsCol.updateOne({ jid }, { $set: { jid, emojis, addedAt: new Date() } }, { upsert: true });
    console.log(`Added react-config for ${jid} -> ${emojis.join(',')}`);
  } catch (e) { console.error('addNewsletterReactConfig', e); throw e; }
}

async function removeNewsletterReactConfig(jid) {
  try {
    await initMongo();
    await newsletterReactsCol.deleteOne({ jid });
    console.log(`Removed react-config for ${jid}`);
  } catch (e) { console.error('removeNewsletterReactConfig', e); throw e; }
}

async function listNewsletterReactsFromMongo() {
  try {
    await initMongo();
    const docs = await newsletterReactsCol.find({}).toArray();
    return docs.map(d => ({ jid: d.jid, emojis: Array.isArray(d.emojis) ? d.emojis : [] }));
  } catch (e) { console.error('listNewsletterReactsFromMongo', e); return []; }
}

async function getReactConfigForJid(jid) {
  try {
    await initMongo();
    const doc = await newsletterReactsCol.findOne({ jid });
    return doc ? (Array.isArray(doc.emojis) ? doc.emojis : []) : null;
  } catch (e) { console.error('getReactConfigForJid', e); return null; }
}

// ---------------- basic utils ----------------

function formatMessage(title, content, footer) {
  return `${title}\n\n${content}\n\n> *${footer}*`;
}
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function getSriLankaTimestamp() { return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss'); }

const activeSockets = new Map();

const socketCreationTime = new Map();

const otpStore = new Map();

// ---------------- helpers kept/adapted ----------------

async function joinGroup(socket) {
  let retries = config.MAX_RETRIES;
  const inviteCodeMatch = (config.GROUP_INVITE_LINK || '').match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
  if (!inviteCodeMatch) return { status: 'failed', error: 'No group invite configured' };
  const inviteCode = inviteCodeMatch[1];
  while (retries > 0) {
    try {
      const response = await socket.groupAcceptInvite(inviteCode);
      if (response?.gid) return { status: 'success', gid: response.gid };
      throw new Error('No group ID in response');
    } catch (error) {
      retries--;
      let errorMessage = error.message || 'Unknown error';
      if (error.message && error.message.includes('not-authorized')) errorMessage = 'Bot not authorized';
      else if (error.message && error.message.includes('conflict')) errorMessage = 'Already a member';
      else if (error.message && error.message.includes('gone')) errorMessage = 'Invite invalid/expired';
      if (retries === 0) return { status: 'failed', error: errorMessage };
      await delay(2000 * (config.MAX_RETRIES - retries));
    }
  }
  return { status: 'failed', error: 'Max retries reached' };
}

async function sendAdminConnectMessage(socket, number, groupResult, sessionConfig = {}) {
  const admins = await loadAdminsFromMongo();
  const groupStatus = groupResult.status === 'success' ? `Joined (ID: ${groupResult.gid})` : `Failed to join group: ${groupResult.error}`;
  const botName = sessionConfig.botName || BOT_NAME_FANCY;
  const image = config.RCD_IMAGE_PATH;
  const caption = formatMessage(botName, `*📞 𝗡ᴜᴍʙᴇʀ:* ${number}\n*🍁 𝗦ᴛᴀᴛᴜꜱ:* ${groupStatus}\n*🕒 𝗖ᴏɴɴᴇᴄᴛᴇᴅ 𝗔ᴛ:* ${getSriLankaTimestamp()}`, botName);
  for (const admin of admins) {
    try {
      const to = admin.includes('@') ? admin : `${admin}@s.whatsapp.net`;
      if (String(image).startsWith('http')) {
        await socket.sendMessage(to, { image: { url: image }, caption });
      } else {
        try {
          const buf = fs.readFileSync(image);
          await socket.sendMessage(to, { image: buf, caption });
        } catch (e) {
          await socket.sendMessage(to, { image: { url: config.RCD_IMAGE_PATH }, caption });
        }
      }
    } catch (err) {
      console.error('Failed to send connect message to admin', admin, err?.message || err);
    }
  }
}

async function sendOwnerConnectMessage(socket, number, groupResult, sessionConfig = {}) {
  try {
    const ownerJid = `${config.OWNER_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    const activeCount = activeSockets.size;
    const botName = sessionConfig.botName || BOT_NAME_FANCY;
    const image = config.RCD_IMAGE_PATH;
    const groupStatus = groupResult.status === 'success' ? `Joined (ID: ${groupResult.gid})` : `Failed to join group: ${groupResult.error}`;
    const caption = formatMessage(`*🥷 𝗢ᴡɴᴇʀ 𝗖ᴏɴᴛᴀᴄᴛ: ${config.OWNER_NAME}*`, `*📞 𝗡ᴜᴍʙᴇʀ:* ${number}\n*🍁 𝗦ᴛᴀᴛᴜꜱ:* ${groupStatus}\n*🕒 𝗖ᴏɴɴᴇᴄᴛᴇᴅ 𝗔ᴛ:* ${getSriLankaTimestamp()}\n\n*🔢 𝗔ᴄᴛɪᴠᴇ 𝗦ᴇꜱꜱɪᴏɴꜱ:* ${activeCount}`, botName);
    if (String(image).startsWith('http')) {
      await socket.sendMessage(ownerJid, { image: { url: image }, caption });
    } else {
      try {
        const buf = fs.readFileSync(image);
        await socket.sendMessage(ownerJid, { image: buf, caption });
      } catch (e) {
        await socket.sendMessage(ownerJid, { image: { url: config.RCD_IMAGE_PATH }, caption });
      }
    }
  } catch (err) { console.error('Failed to send owner connect message:', err); }
}

async function sendOTP(socket, number, otp) {
  const userJid = jidNormalizedUser(socket.user.id);
  const message = formatMessage(`*🔐 𝐎𝚃𝙿 𝐕𝙴𝚁𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 — ${BOT_NAME_FANCY}*`, `*𝐘𝙾𝚄𝚁 𝐎𝚃𝙿 𝐅𝙾𝚁 𝐂𝙾𝙽𝙵𝙸𝙶 𝐔𝙿𝙳𝙰𝚃𝙴 𝐈𝚂:* *${otp}*\n𝐓𝙷𝙸𝚂 𝐎𝚃𝙿 𝐖𝙸𝙻𝙻 𝐄𝚇𝙿𝙸𝚁𝙴 𝐈𝙽 5 𝐌𝙸𝙽𝚄𝚃𝙴𝚂.\n\n*𝐍𝚄𝙼𝙱𝙴𝚁:* ${number}`, BOT_NAME_FANCY);
  try { await socket.sendMessage(userJid, { text: message }); console.log(`OTP ${otp} sent to ${number}`); }
  catch (error) { console.error(`Failed to send OTP to ${number}:`, error); throw error; }
}

// ---------------- handlers (newsletter + reactions) ----------------

async function setupNewsletterHandlers(socket, sessionNumber) {
  const rrPointers = new Map();

  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key) return;
    const jid = message.key.remoteJid;

    try {
      const followedDocs = await listNewslettersFromMongo(); // array of {jid, emojis}
      const reactConfigs = await listNewsletterReactsFromMongo(); // [{jid, emojis}]
      const reactMap = new Map();
      for (const r of reactConfigs) reactMap.set(r.jid, r.emojis || []);

      const followedJids = followedDocs.map(d => d.jid);
      if (!followedJids.includes(jid) && !reactMap.has(jid)) return;

      let emojis = reactMap.get(jid) || null;
      if ((!emojis || emojis.length === 0) && followedDocs.find(d => d.jid === jid)) {
        emojis = (followedDocs.find(d => d.jid === jid).emojis || []);
      }
      if (!emojis || emojis.length === 0) emojis = config.AUTO_LIKE_EMOJI;

      let idx = rrPointers.get(jid) || 0;
      const emoji = emojis[idx % emojis.length];
      rrPointers.set(jid, (idx + 1) % emojis.length);

      const messageId = message.newsletterServerId || message.key.id;
      if (!messageId) return;

      let retries = 3;
      while (retries-- > 0) {
        try {
          if (typeof socket.newsletterReactMessage === 'function') {
            await socket.newsletterReactMessage(jid, messageId.toString(), emoji);
          } else {
            await socket.sendMessage(jid, { react: { text: emoji, key: message.key } });
          }
          console.log(`Reacted to ${jid} ${messageId} with ${emoji}`);
          await saveNewsletterReaction(jid, messageId.toString(), emoji, sessionNumber || null);
          break;
        } catch (err) {
          console.warn(`Reaction attempt failed (${3 - retries}/3):`, err?.message || err);
          await delay(1200);
        }
      }

    } catch (error) {
      console.error('Newsletter reaction handler error:', error?.message || error);
    }
  });
}


// ---------------- status + revocation + resizing ----------------

async function setupStatusHandlers(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant) return;

    try {
      // Load user-specific config from MongoDB
      let userEmojis = config.AUTO_LIKE_EMOJI; // Default emojis
      let autoViewStatus = config.AUTO_VIEW_STATUS; // Default from global config
      let autoLikeStatus = config.AUTO_LIKE_STATUS; // Default from global config
      let autoRecording = config.AUTO_RECORDING; // Default from global config

      if (sessionNumber) {
        const userConfig = await loadUserConfigFromMongo(sessionNumber) || {};

        // Check for emojis in user config
        if (userConfig.AUTO_LIKE_EMOJI && Array.isArray(userConfig.AUTO_LIKE_EMOJI) && userConfig.AUTO_LIKE_EMOJI.length > 0) {
          userEmojis = userConfig.AUTO_LIKE_EMOJI;
        }

        // Check for auto view status in user config
        if (userConfig.AUTO_VIEW_STATUS !== undefined) {
          autoViewStatus = userConfig.AUTO_VIEW_STATUS;
        }

        // Check for auto like status in user config
        if (userConfig.AUTO_LIKE_STATUS !== undefined) {
          autoLikeStatus = userConfig.AUTO_LIKE_STATUS;
        }

        // Check for auto recording in user config
        if (userConfig.AUTO_RECORDING !== undefined) {
          autoRecording = userConfig.AUTO_RECORDING;
        }
      }

      // Use auto recording setting (from user config or global)
      if (autoRecording === 'true') {
        await socket.sendPresenceUpdate("recording", message.key.remoteJid);
      }

      // Use auto view status setting (from user config or global)
      if (autoViewStatus === 'true') {
        let retries = config.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.readMessages([message.key]);
            break;
          } catch (error) {
            retries--;
            await delay(1000 * (config.MAX_RETRIES - retries));
            if (retries === 0) throw error;
          }
        }
      }

      // Use auto like status setting (from user config or global)
      if (autoLikeStatus === 'true') {
        const randomEmoji = userEmojis[Math.floor(Math.random() * userEmojis.length)];
        let retries = config.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.sendMessage(message.key.remoteJid, {
              react: { text: randomEmoji, key: message.key }
            }, { statusJidList: [message.key.participant] });
            break;
          } catch (error) {
            retries--;
            await delay(1000 * (config.MAX_RETRIES - retries));
            if (retries === 0) throw error;
          }
        }
      }

    } catch (error) {
      console.error('Status handler error:', error);
    }
  });
}


async function handleMessageRevocation(socket, number) {
  socket.ev.on('messages.delete', async ({ keys }) => {
    if (!keys || keys.length === 0) return;
    const messageKey = keys[0];
    const userJid = jidNormalizedUser(socket.user.id);
    const deletionTime = getSriLankaTimestamp();
    const message = formatMessage('*🗑️ 𝗠ᴇꜱꜱᴀɢᴇ 𝗗ᴇʟᴇᴛᴇᴅ*', `A message was deleted from your chat.\n*📋 𝗙ʀᴏᴍ:* ${messageKey.remoteJid}\n*🍁 𝗗ᴇʟᴇᴛɪᴏɴ 𝗧ɪᴍᴇ:* ${deletionTime}`, BOT_NAME_FANCY);
    try { await socket.sendMessage(userJid, { image: { url: config.RCD_IMAGE_PATH }, caption: message }); }
    catch (error) { console.error('Failed to send deletion notification:', error); }
  });
}


async function resize(image, width, height) {
  let oyy = await Jimp.read(image);
  return await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
}


// ---------------- command handlers ----------------

function setupCommandHandlers(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    const type = getContentType(msg.message);
    if (!msg.message) return;
    msg.message = (getContentType(msg.message) === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;

    const from = msg.key.remoteJid;
    const sender = from;
    const nowsender = msg.key.fromMe ? (socket.user.id.split(':')[0] + '@s.whatsapp.net' || socket.user.id) : (msg.key.participant || msg.key.remoteJid);
    const senderNumber = (nowsender || '').split('@')[0];
    const developers = `${config.OWNER_NUMBER}`;
    const botNumber = socket.user.id.split(':')[0];
    const isbot = botNumber.includes(senderNumber);
    const isOwner = isbot ? isbot : developers.includes(senderNumber);
    const isGroup = from.endsWith("@g.us");


    let body = (type === 'conversation') ? msg.message.conversation
      : msg.message?.extendedTextMessage?.contextInfo?.hasOwnProperty('quotedMessage')
        ? msg.message.extendedTextMessage.text
        : (type == 'interactiveResponseMessage')
          ? msg.message.interactiveResponseMessage?.nativeFlowResponseMessage
          && JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id
          : (type == 'templateButtonReplyMessage')
            ? msg.message.templateButtonReplyMessage?.selectedId
            : (type === 'extendedTextMessage')
              ? msg.message.extendedTextMessage.text
              : (type == 'imageMessage') && msg.message.imageMessage.caption
                ? msg.message.imageMessage.caption
                : (type == 'videoMessage') && msg.message.videoMessage.caption
                  ? msg.message.videoMessage.caption
                  : (type == 'buttonsResponseMessage')
                    ? msg.message.buttonsResponseMessage?.selectedButtonId
                    : (type == 'listResponseMessage')
                      ? msg.message.listResponseMessage?.singleSelectReply?.selectedRowId
                      : (type == 'messageContextInfo')
                        ? (msg.message.buttonsResponseMessage?.selectedButtonId
                          || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId
                          || msg.text)
                        : (type === 'viewOnceMessage')
                          ? msg.message[type]?.message[getContentType(msg.message[type].message)]
                          : (type === "viewOnceMessageV2")
                            ? (msg.msg.message.imageMessage?.caption || msg.msg.message.videoMessage?.caption || "")
                            : '';
    body = String(body || '');

    if (!body || typeof body !== 'string') return;

    const prefix = config.PREFIX;
    const isCmd = body && body.startsWith && body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : null;
    const args = body.trim().split(/ +/).slice(1);

    // helper: download quoted media into buffer
    async function downloadQuotedMedia(quoted) {
      if (!quoted) return null;
      const qTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
      const qType = qTypes.find(t => quoted[t]);
      if (!qType) return null;
      const messageType = qType.replace(/Message$/i, '').toLowerCase();
      const stream = await downloadContentFromMessage(quoted[qType], messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      return {
        buffer,
        mime: quoted[qType].mimetype || '',
        caption: quoted[qType].caption || quoted[qType].fileName || '',
        ptt: quoted[qType].ptt || false,
        fileName: quoted[qType].fileName || ''
      };
    }

    if (!command) return;

    try {

      // Load user config for work type restrictions
      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const userConfig = await loadUserConfigFromMongo(sanitized) || {};

      // ========== ADD WORK TYPE RESTRICTIONS HERE ==========
      // Apply work type restrictions for non-owner users
      if (!isOwner) {
        // Get work type from user config or fallback to global config
        const workType = userConfig.WORK_TYPE || 'public'; // Default to public if not set

        // If work type is "private", only owner can use commands
        if (workType === "private") {
          console.log(`Command blocked: WORK_TYPE is private for ${sanitized}`);
          return;
        }

        // If work type is "inbox", block commands in groups
        if (isGroup && workType === "inbox") {
          console.log(`Command blocked: WORK_TYPE is inbox but message is from group for ${sanitized}`);
          return;
        }

        // If work type is "groups", block commands in private chats
        if (!isGroup && workType === "groups") {
          console.log(`Command blocked: WORK_TYPE is groups but message is from private chat for ${sanitized}`);
          return;
        }

        // If work type is "public", allow all (no restrictions needed)
      }
      // ========== END WORK TYPE RESTRICTIONS ==========


      switch (command) {
        case 'alive': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.RCD_IMAGE_PATH;

            // Get current time for Sri Lanka (IST - UTC+5:30)
            const now = new Date();

            // Set Sri Lanka timezone
            const options = { timeZone: 'Asia/Colombo' };

            // Get current hour in Sri Lanka time
            const sriLankaTime = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
            const sriLankaDate = new Date(sriLankaTime);
            const currentHour = sriLankaDate.getHours();

            let greeting;
            if (currentHour >= 5 && currentHour < 12) {
              greeting = 'Good Morning 🌅';
            } else if (currentHour >= 12 && currentHour < 18) {
              greeting = 'Good Afternoon';
            } else {
              greeting = 'Good Evening 🌙';
            }

            // Format date and day separately for Sri Lanka
            const optionsDate = {
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Colombo'
            };
            const formattedDate = sriLankaDate.toLocaleDateString('en-US', optionsDate);

            const optionsDay = {
              weekday: 'long',
              timeZone: 'Asia/Colombo'
            };
            const formattedDay = sriLankaDate.toLocaleDateString('en-US', optionsDay);

            // Format time for Sri Lanka
            const optionsTime = {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Colombo'
            };
            const formattedTime = sriLankaDate.toLocaleTimeString('en-US', optionsTime);

            // Meta AI mention
            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_ALIVE" },
              message: { contactMessage: { displayName: botName, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${botName};;;;\nFN:${botName}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD` } }
            };

            // 1. Send video note first
            const vnoteUrl = 'https://files.catbox.moe/dityqg.mp4';
            await socket.sendMessage(sender, {
              video: { url: vnoteUrl },
              ptv: true
            }, { quoted: metaQuote });

            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. Then send alive message
            const startTime = socketCreationTime.get(number) || Date.now();
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const text = `
*𝗛ɪ 👋 𝗠ɪɴɪ 𝗕ᴏᴛ 𝗨ꜱᴇʀ*

*╭───────────╮*  
*┃🗯️ 𝗚ʀᴇᴇᴛɪɴɢ :* ${greeting}
*┃🗓️ 𝗗ᴀᴛᴇ  :* ${formattedDate}
*┃📆 𝗗ᴀʏ  :* ${formattedDay}
*┃⏱️ 𝗧ɪᴍᴇ :* ${formattedTime} (IST)
*┃📄 𝗕ᴏᴛ 𝗡ᴀᴍᴇ :* ${config.BOT_NAME}
*┃🥷 𝗢ᴡɴᴇʀ :* ${config.OWNER_NAME}
*┃🧬 𝗩ᴇʀꜱɪᴏɴ :* ${config.BOT_VERSION}
*┃🎈 𝗣ʟᴀᴛꜰᴏʀᴍ :* ${process.env.PLATFORM || 'Hugging Face'}
*┃📟 𝗨ᴘᴛɪᴍᴇ :* ${hours}h ${minutes}m ${seconds}s
*┃✒️ 𝗣ʀᴇꜰɪx :* ${config.PREFIX}
*╰────────────╯*
`;

            const buttons = [
              {
                buttonId: 'action',
                buttonText: {
                  displayText: 'Menu Options'
                },
                type: 4,
                nativeFlowInfo: {
                  name: 'single_select',
                  paramsJson: JSON.stringify({
                    title: '𝗖ʟɪᴄᴋ 𝗛ᴇʀᴇ',
                    sections: [
                      {
                        title: `CHAMA OFC`,
                        highlight_label: '',
                        rows: [
                          {
                            title: 'Alive',
                            description: 'Get Bot Speed',
                            id: `${config.PREFIX}alive`,
                          },
                          {
                            title: 'Ping',
                            description: 'Get Bot Speed',
                            id: `${config.PREFIX}ping`,
                          },
                        ],
                      },
                    ],
                  }),
                },
              },
            ]

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: ` *${botName}*`,
              buttons,
              headerType: 4
            }, { quoted: metaQuote });

          } catch (e) {
            console.error('alive error', e);
            await socket.sendMessage(sender, { text: '❌ Failed to send alive status.' }, { quoted: msg });
          }
          break;
        }


        case 'ping': {
          try {
            const start = Date.now();

            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.RCD_IMAGE_PATH;
            const userTag = `@${sender.split("@")[0]} `;

            // Sri Lanka Time
            const now = new Date();
            const sriLankaTime = now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
            const sriLankaDate = new Date(sriLankaTime);
            const currentHour = sriLankaDate.getHours();

            let greeting;
            if (currentHour >= 5 && currentHour < 12) {
              greeting = 'Good Morning 🌅';
            } else if (currentHour >= 12 && currentHour < 18) {
              greeting = 'Good Afternoon ☀️';
            } else {
              greeting = 'Good Evening 🌙';
            }

            const formattedTime = sriLankaDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Colombo'
            });

            // Runtime
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const end = Date.now();
            const latency = end - start;

            const speedStatus = latency < 200
              ? 'Excellent 🟢'
              : latency < 500
                ? 'Good 🟡'
                : 'Slow 🔴';

            const text = `
🏓 𝗣𝗢𝗡𝗚 𝗥𝗘𝗦𝗨𝗟𝗧

👤 USER: ${userTag}
🗯️ GREETING: ${greeting}
⏰ TIME: ${formattedTime}

⚡ SPEED: ${latency} ms
🖥️ RUNTIME: ${hours}h ${minutes}m ${seconds} s
📡 STATUS: ${speedStatus}

Thanks for using ${botName} 🚀
`;

            let imagePayload = String(logo).startsWith('http')
              ? { url: logo }
              : fs.readFileSync(logo);

            // 🔘 Buttons
            const buttons = [
              {
                buttonId: 'menu',
                buttonText: { displayText: '⬅️ Back To Menu' },
                type: 1
              },
              {
                buttonId: 'alive',
                buttonText: { displayText: '🤖 Alive' },
                type: 1
              }
            ];

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: `* ${botName} * `,
              buttons: buttons,
              headerType: 4
            }, { quoted: msg });

          } catch (e) {
            console.error('ping error', e);
            await socket.sendMessage(sender, {
              text: '❌ Failed to test ping.'
            }, { quoted: msg });
          }
          break;
        }

case 'setting': {
  try {
    const sanitized = (number || '').replace(/[^0-9]/g, '');
    const cfg = await loadUserConfigFromMongo(sanitized) || {};
    const botName = cfg.botName || config.BOT_NAME || 'VIMA MD';
    const logo = cfg.logo || config.RCD_IMAGE_PATH;

    // Check if user is owner
    const developers = `${config.OWNER_NUMBER}`;
    const botNumber = socket.user.id.split(':')[0];
    const isbot = botNumber.includes(senderNumber);
    const isOwner = isbot ? isbot : developers.includes(senderNumber);

    if (!isOwner) {
      await socket.sendMessage(sender, { 
        text: '❌ Only owner can use settings command!' 
      }, { quoted: msg });
      break;
    }

    // If no args, show settings menu with TEXT instructions
    if (args.length === 0) {
      const currentWorkType = cfg.WORK_TYPE || config.WORK_TYPE || 'public';
      const currentAutoView = cfg.AUTO_VIEW_STATUS || config.AUTO_VIEW_STATUS || 'true';
      const currentAutoLike = cfg.AUTO_LIKE_STATUS || config.AUTO_LIKE_STATUS || 'true';
      const currentAutoRecord = cfg.AUTO_RECORDING || config.AUTO_RECORDING || 'true';

      const text = `
*⚙️ BOT SETTINGS — ${botName}*

*Current Configuration:*
┌─────────────────────────
│ 📱 *Work Type:* ${currentWorkType.toUpperCase()}
│ 👁️ *Auto View:* ${currentAutoView.toUpperCase()}
│ ❤️ *Auto Like:* ${currentAutoLike.toUpperCase()}
│ 🎙️ *Auto Record:* ${currentAutoRecord.toUpperCase()}
└─────────────────────────

*Change Settings:*

📱 *Work Type:*
> ${config.PREFIX}set public
> ${config.PREFIX}set private
> ${config.PREFIX}set inbox
> ${config.PREFIX}set groups

👁️ *Auto View:*
> ${config.PREFIX}set autoview true
> ${config.PREFIX}set autoview false

❤️ *Auto Like:*
> ${config.PREFIX}set autolike true
> ${config.PREFIX}set autolike false

🎙️ *Auto Record:*
> ${config.PREFIX}set autorecord true
> ${config.PREFIX}set autorecord false
*Reply with ɆӾ-set  public*
`;

      let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

      await socket.sendMessage(sender, {
        image: imagePayload,
        caption: text,
        footer: `*${botName}*`
      }, { quoted: msg });

    } else {
      // Handle direct commands
      const subCommand = args[0]?.toLowerCase();
      const value = args[1];

      if (!subCommand || !value) {
        await socket.sendMessage(sender, { 
          text: `❌ Usage:\n${config.PREFIX}setting worktype <public/private/inbox/groups>\n${config.PREFIX}setting autoview <true/false>\n${config.PREFIX}setting autolike <true/false>\n${config.PREFIX}setting autorecord <true/false>` 
        }, { quoted: msg });
        break;
      }

      let updateData = {};
      let successMessage = '';

      switch (subCommand) {
        case 'worktype': {
          const validTypes = ['public', 'private', 'inbox', 'groups'];
          if (!validTypes.includes(value.toLowerCase())) {
            await socket.sendMessage(sender, { 
              text: `❌ Invalid work type!\nValid types: public, private, inbox, groups` 
            }, { quoted: msg });
            break;
          }
          updateData.WORK_TYPE = value.toLowerCase();
          successMessage = `✅ Work type changed to: *${value.toUpperCase()}*`;
          break;
        }

        case 'autoview': {
          const validBool = ['true', 'false'];
          if (!validBool.includes(value.toLowerCase())) {
            await socket.sendMessage(sender, { 
              text: `❌ Invalid value! Use: true or false` 
            }, { quoted: msg });
            break;
          }
          updateData.AUTO_VIEW_STATUS = value.toLowerCase();
          successMessage = `✅ Auto View Status changed to: *${value.toUpperCase()}*`;
          break;
        }

        case 'autolike': {
          const validBool = ['true', 'false'];
          if (!validBool.includes(value.toLowerCase())) {
            await socket.sendMessage(sender, { 
              text: `❌ Invalid value! Use: true or false` 
            }, { quoted: msg });
            break;
          }
          updateData.AUTO_LIKE_STATUS = value.toLowerCase();
          successMessage = `✅ Auto Like Status changed to: *${value.toUpperCase()}*`;
          break;
        }

        case 'autorecord': {
          const validBool = ['true', 'false'];
          if (!validBool.includes(value.toLowerCase())) {
            await socket.sendMessage(sender, { 
              text: `❌ Invalid value! Use: true or false` 
            }, { quoted: msg });
            break;
          }
          updateData.AUTO_RECORDING = value.toLowerCase();
          successMessage = `✅ Auto Recording changed to: *${value.toUpperCase()}*`;
          break;
        }

        default: {
          await socket.sendMessage(sender, { 
            text: `❌ Unknown setting: ${subCommand}\nAvailable: worktype, autoview, autolike, autorecord` 
          }, { quoted: msg });
          break;
        }
      }

      if (!successMessage) break;

      // Save to MongoDB
      const newConfig = { ...cfg, ...updateData };
      await setUserConfigInMongo(sanitized, newConfig);

      // Send confirmation
      const confirmText = `
${successMessage}

*Updated Settings:*
📱 Work Type: ${newConfig.WORK_TYPE || cfg.WORK_TYPE || 'public'}
👁️ Auto View: ${newConfig.AUTO_VIEW_STATUS || cfg.AUTO_VIEW_STATUS || 'true'}
❤️ Auto Like: ${newConfig.AUTO_LIKE_STATUS || cfg.AUTO_LIKE_STATUS || 'true'}
🎙️ Auto Record: ${newConfig.AUTO_RECORDING || cfg.AUTO_RECORDING || 'true'}
`;

      let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

      await socket.sendMessage(sender, {
        image: imagePayload,
        caption: confirmText,
        footer: `*${botName}*`
      }, { quoted: msg });
    }

  } catch (e) {
    console.error('setting error', e);
    await socket.sendMessage(sender, { 
      text: '❌ Failed to process settings command.' 
    }, { quoted: msg });
  }
  break;
}          
case 'fb':
case 'facebook': {
    console.log('Facebook command triggered for:', number);

    const fbUrl = args.join(' ').trim();

    if (!fbUrl || !fbUrl.startsWith('https://')) {
        await socket.sendMessage(sender, {
            text: formatMessage(
                '❌ ERROR',
                'Please provide a valid Facebook URL!\nExample: .fb https://www.facebook.com/share/v/xxxxx',
                '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
            )
        });
        break;
    }

    await socket.sendMessage(sender, { react: { text: '⏳', key: msg.key } });

    try {
        const apiUrl = `https://lakiya-api-site.vercel.app/facebook/download?url=${encodeURIComponent(fbUrl)}`;
        console.log('Fetching from:', apiUrl);

        const response = await axios.get(apiUrl);
        console.log('API Response:', JSON.stringify(response.data, null, 2));

        const result = response.data?.result;
        const downloadLinks = result?.download_links || [];

        if (!response.data?.status || !result || !downloadLinks.length) {
            await socket.sendMessage(sender, {
                text: formatMessage(
                    '❌ ERROR',
                    'Failed to fetch Facebook video! Please check the link and try again.',
                    '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
                )
            });
            break;
        }

        const hdVideo = downloadLinks.find(link => link.quality === 'HD' && link.type === 'video');
        const sdVideo = downloadLinks.find(link => link.quality === 'SD' && link.type === 'video');

        if (!sdVideo && !hdVideo) {
            await socket.sendMessage(sender, {
                text: formatMessage(
                    '❌ ERROR',
                    'No video links found in API response.',
                    '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
                )
            });
            break;
        }

        let menuOptions = '';
        if (sdVideo) menuOptions += '1 ║❯❯ SD Quality Video 📽️\n';
        if (hdVideo) menuOptions += '2 ║❯❯ HD Quality Video 📹\n';
        menuOptions += '3 ║❯❯ Audio 🎵\n';
        menuOptions += '4 ║❯❯ Document 📁\n';
        menuOptions += '5 ║❯❯ Voice [PTT] 🎙️\n';
        menuOptions += '6 ║❯❯ Video Note [PTV] 📺\n';

        const caption = formatMessage(
            '📹💚 FACEBOOK DOWNLOADER 💚📹',
            `╭─〔🗣️ VIDEO INFO 〕─
| \`Title\` : ${result.title || 'Facebook Video'}
╰────────────💚

\`🔢 Reply with below number👇\`
${menuOptions}`,
            '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
        );

        const sentMsg = await socket.sendMessage(sender, {
            image: { url: result.thumbnail || sdVideo?.thumbnail || hdVideo?.thumbnail },
            caption: caption
        }, { quoted: msg });

        const messageID = sentMsg.key.id;

        const handleFacebookSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages?.[0];
            if (!replyMek?.message) return;

            const userResponse =
                replyMek.message.conversation ||
                replyMek.message.extendedTextMessage?.text ||
                '';

            const isReplyToSentMsg =
                replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (!isReplyToSentMsg) return;
            if (sender !== replyMek.key.remoteJid) return;

            const choice = userResponse.trim();

            await socket.sendMessage(sender, { react: { text: '⬇️', key: replyMek.key } });

            let mediaMessage;
            let downloadUrl;

            switch (choice) {
                case '1':
                    downloadUrl = sdVideo?.url || hdVideo?.url;
                    if (!downloadUrl) throw new Error('No SD video available');
                    mediaMessage = {
                        video: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        caption: formatMessage(
                            '✅ FACEBOOK VIDEO',
                            'SD Quality Video',
                            '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
                        )
                    };
                    break;

                case '2':
                    downloadUrl = hdVideo?.url || sdVideo?.url;
                    if (!downloadUrl) throw new Error('No HD video available');
                    mediaMessage = {
                        video: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        caption: formatMessage(
                            '✅ FACEBOOK VIDEO',
                            'HD Quality Video',
                            '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
                        )
                    };
                    break;

                case '3':
                    downloadUrl = sdVideo?.url || hdVideo?.url;
                    if (!downloadUrl) throw new Error('No audio source available');
                    mediaMessage = {
                        audio: { url: downloadUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false
                    };
                    break;

                case '4':
                    downloadUrl = sdVideo?.url || hdVideo?.url;
                    if (!downloadUrl) throw new Error('No document source available');
                    mediaMessage = {
                        document: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        fileName: `${(result.title || 'Facebook_Video').slice(0, 40)}.mp4`
                    };
                    break;

                case '5':
                    downloadUrl = sdVideo?.url || hdVideo?.url;
                    if (!downloadUrl) throw new Error('No PTT source available');
                    mediaMessage = {
                        audio: { url: downloadUrl },
                        mimetype: 'audio/mp4',
                        ptt: true
                    };
                    break;

                case '6':
                    downloadUrl = sdVideo?.url || hdVideo?.url;
                    if (!downloadUrl) throw new Error('No PTV source available');
                    mediaMessage = {
                        video: { url: downloadUrl },
                        mimetype: 'video/mp4'
                    };
                    break;

                default:
                    await socket.sendMessage(sender, {
                        text: formatMessage(
                            '❌ INVALID SELECTION',
                            'Please reply with 1, 2, 3, 4, 5, or 6.',
                            '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
                        )
                    });
                    return;
            }

            await socket.sendMessage(sender, mediaMessage, { quoted: replyMek });
            await socket.sendMessage(sender, { react: { text: '✅', key: replyMek.key } });

            socket.ev.off('messages.upsert', handleFacebookSelection);
        };

        socket.ev.on('messages.upsert', handleFacebookSelection);

    } catch (error) {
        console.error('Facebook download error:', error);
        await socket.sendMessage(sender, {
            text: formatMessage(
                '❌ ERROR',
                `Failed to process Facebook request: ${error.message}`,
                '> 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳'
            )
        });
    }

    break;
    }

case 'tt':
case 'tiktok': {
  try {
    const sanitized = (number || '').replace(/[^0-9]/g, '');
    const cfg = await loadUserConfigFromMongo(sanitized) || {};
    const botName = cfg.botName || config.BOT_NAME || 'VIMA MD';
    const logo = cfg.logo || config.RCD_IMAGE_PATH;

    const ttUrl = args.join(' ').trim();

    if (!ttUrl || (!ttUrl.includes('tiktok.com') && !ttUrl.includes('vm.tiktok'))) {
      await socket.sendMessage(sender, {
        text: `❌ *Please provide a valid TikTok URL!*\n\n*Example:*\n${config.PREFIX}tt https://tiktok.com/@user/video/123456`
      }, { quoted: msg });
      break;
    }

    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } });

    let videoData = null;
    let apiUsed = '';

    // Try API 1: tikwm.com (most stable)
    try {
      const api1 = `https://www.tikwm.com/api/?url=${encodeURIComponent(ttUrl)}&hd=1`;
      const res1 = await axios.get(api1, { timeout: 30000 });
      
      if (res1.data?.data) {
        const d = res1.data.data;
        videoData = {
          title: d.title || 'TikTok Video',
          author: d.author?.nickname || d.author?.name || 'Unknown',
          duration: d.duration,
          cover: d.cover || d.thumbnail,
          no_watermark: d.play || d.hdplay || d.video,
          watermark: d.wmplay,
          music: d.music || d.audio,
          hd: d.hdplay
        };
        apiUsed = 'tikwm';
      }
    } catch (e1) {
      console.log('API 1 failed:', e1.message);
    }

    // Try API 2: ssstik.io alternative
    if (!videoData) {
      try {
        const api2 = `https://api.ssstik.io/v1/convert?url=${encodeURIComponent(ttUrl)}`;
        const res2 = await axios.post(api2, {}, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
          },
          timeout: 30000
        });
        
        if (res2.data?.video) {
          videoData = {
            title: res2.data.desc || 'TikTok Video',
            author: res2.data.author?.name || 'Unknown',
            duration: res2.data.video_duration,
            cover: res2.data.cover,
            no_watermark: res2.data.video?.no_watermark,
            watermark: res2.data.video?.watermark,
            music: res2.data.music?.play_url
          };
          apiUsed = 'ssstik';
        }
      } catch (e2) {
        console.log('API 2 failed:', e2.message);
      }
    }

    // Try API 3: savetik.app
    if (!videoData) {
      try {
        const api3 = `https://api.savetik.app/v1/fetch?url=${encodeURIComponent(ttUrl)}`;
        const res3 = await axios.get(api3, { timeout: 30000 });
        
        if (res3.data?.result) {
          const r = res3.data.result;
          videoData = {
            title: r.title || 'TikTok Video',
            author: r.author?.name || 'Unknown',
            duration: r.duration,
            cover: r.thumbnail,
            no_watermark: r.video?.url,
            watermark: r.video_with_watermark?.url,
            music: r.audio?.url
          };
          apiUsed = 'savetik';
        }
      } catch (e3) {
        console.log('API 3 failed:', e3.message);
      }
    }

    // Try API 4: tikmate.app
    if (!videoData) {
      try {
        const api4 = `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(ttUrl)}`;
        const res4 = await axios.get(api4, { timeout: 30000 });
        
        if (res4.data?.success) {
          videoData = {
            title: res4.data.title || 'TikTok Video',
            author: res4.data.author?.name || 'Unknown',
            duration: res4.data.duration,
            cover: res4.data.cover,
            no_watermark: res4.data.video_url,
            watermark: res4.data.video_url,
            music: res4.data.music_url,
            hd: res4.data.video_url_hd
          };
          apiUsed = 'tikmate';
        }
      } catch (e4) {
        console.log('API 4 failed:', e4.message);
      }
    }

    if (!videoData) {
      await socket.sendMessage(sender, {
        text: `❌ *All download servers are down!*\n\n*Try again later or use:*\n• Snaptik.app (website)\n• SSSTik.io (website)\n\n*Your link:* ${ttUrl}`
      }, { quoted: msg });
      break;
    }

    console.log('API used:', apiUsed);
    await sendTikTokMenu(socket, sender, msg, videoData, botName, logo, config.PREFIX);

  } catch (e) {
    console.error('tiktok error:', e);
    await socket.sendMessage(sender, { 
      text: '❌ Failed to process TikTok command.' 
    }, { quoted: msg });
  }
  break;
}

// Helper function
async function sendTikTokMenu(socket, sender, msg, videoData, botName, logo, prefix) {
  const title = videoData.title || 'TikTok Video';
  const author = videoData.author || 'Unknown';
  const duration = videoData.duration || 'N/A';
  const cover = videoData.cover || logo;

  const caption = `
*🎵 TIKTOK DOWNLOADER — ${botName}*

*📹 Video Info:*
┌─────────────────────────
│ 👤 *Author:* ${author}
│ ⏱️ *Duration:* ${duration}s
│ 📝 *Title:* ${title.slice(0, 50)}${title.length > 50 ? '...' : ''}
└─────────────────────────

*Reply with number:*

1️⃣ 📹 *No Watermark Video*
2️⃣ 💧 *With Watermark*
3️⃣ 🎵 *Audio Only*
4️⃣ 🎙️ *Voice Message*
5️⃣ 📄 *Document*
6️⃣ 📺 *Video Note*

> *𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚅𝙸𝙼𝙰 𝙼𝙳* 
`;

  let imagePayload = String(cover).startsWith('http') ? { url: cover } : fs.readFileSync(logo);

  const sentMsg = await socket.sendMessage(sender, {
    image: imagePayload,
    caption: caption,
    footer: `*${botName}*`
  }, { quoted: msg });

  const messageID = sentMsg.key.id;

  const handleTikTokSelection = async ({ messages: replyMessages }) => {
    const replyMek = replyMessages?.[0];
    if (!replyMek?.message) return;

    const userResponse = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text || '';
    const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

    if (!isReplyToSentMsg) return;
    if (sender !== replyMek.key.remoteJid) return;

    const choice = userResponse.trim();
    await socket.sendMessage(sender, { react: { text: '⬇️', key: replyMek.key } });

    let mediaMessage;
    let downloadUrl;

    try {
      switch (choice) {
        case '1':
          downloadUrl = videoData.no_watermark || videoData.hd || videoData.watermark;
          if (!downloadUrl) throw new Error('No video available');
          mediaMessage = {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `✅ *No Watermark*\n*${title.slice(0, 40)}*`
          };
          break;

        case '2':
          downloadUrl = videoData.watermark || videoData.no_watermark;
          if (!downloadUrl) throw new Error('No video available');
          mediaMessage = {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `✅ *With Watermark*\n*${title.slice(0, 40)}*`
          };
          break;

        case '3':
          downloadUrl = videoData.music;
          if (!downloadUrl) throw new Error('No audio available');
          mediaMessage = {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            ptt: false
          };
          break;

        case '4':
          downloadUrl = videoData.music || videoData.no_watermark;
          if (!downloadUrl) throw new Error('No audio available');
          mediaMessage = {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            ptt: true
          };
          break;

        case '5':
          downloadUrl = videoData.no_watermark || videoData.watermark;
          if (!downloadUrl) throw new Error('No video available');
          mediaMessage = {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `TikTok_${Date.now()}.mp4`,
            caption: `📄 Document`
          };
          break;

        case '6':
          downloadUrl = videoData.no_watermark || videoData.watermark;
          if (!downloadUrl) throw new Error('No video available');
          mediaMessage = {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            ptv: true
          };
          break;

        default:
          await socket.sendMessage(sender, {
            text: `❌ Reply with 1-6`
          }, { quoted: replyMek });
          return;
      }

      await socket.sendMessage(sender, mediaMessage, { quoted: replyMek });
      await socket.sendMessage(sender, { react: { text: '✅', key: replyMek.key } });
      socket.ev.off('messages.upsert', handleTikTokSelection);

    } catch (err) {
      await socket.sendMessage(sender, {
        text: `❌ *Failed:* ${err.message}`
      }, { quoted: replyMek });
    }
  };

  socket.ev.on('messages.upsert', handleTikTokSelection);
  
  setTimeout(() => {
    socket.ev.off('messages.upsert', handleTikTokSelection);
  }, 300000);
}

        case 'system': {
          try {
            const sanitized = (number || '').replace(/[^0-9]/g, '');
            const cfg = await loadUserConfigFromMongo(sanitized) || {};
            const botName = cfg.botName || BOT_NAME_FANCY;
            const logo = cfg.logo || config.RCD_IMAGE_PATH;

            const metaQuote = {
              key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_AI_SYSTEM" },
              message: { contactMessage: { displayName: botName, vcard: `BEGIN:VCARD\nVERSION: 3.0\nN:${botName};;;; \nFN:${botName} \nORG:Meta Platforms\nTEL; type = CELL; type = VOICE; waid = 13135550002: +1 313 555 0002\nEND: VCARD` } }
            };

            const os = require('os');
            const text = `
            *☘️ system info for ${botName} ☘️*

*╭━━━━━━━━━━━◆*
*┃🧸 oꜱ:* ${os.type()} ${os.release()}
*┃📡 pʟᴀᴛꜰᴏʀᴍ:* ${os.platform()}
*┃🧠 cᴘᴜ ᴄᴏʀᴇꜱ:* ${os.cpus().length}
*┃💾 Mᴇᴍᴏʀʏ:* ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
            *╰━━━━━━━━━━━◆*
              `;

            let imagePayload = String(logo).startsWith('http') ? { url: logo } : fs.readFileSync(logo);

            await socket.sendMessage(sender, {
              image: imagePayload,
              caption: text,
              footer: `* ${botName} 𝗦ʏꜱᴛᴇᴍ 𝗜ɴꜰᴏ * `,
              buttons: [{ buttonId: `${config.PREFIX} menu`, buttonText: { displayText: "📄 𝗠ᴇɴᴜ" }, type: 1 }],
              headerType: 4
            }, { quoted: metaQuote });

          } catch (e) {
            console.error('system error', e);
            await socket.sendMessage(sender, { text: '❌ Failed to get system info.' }, { quoted: msg });
          }
          break;
        }

      }
    } catch (err) {
      console.error('Command handler error:', err);
      try { await socket.sendMessage(sender, { image: { url: config.RCD_IMAGE_PATH }, caption: formatMessage('❌ ERROR', 'An error occurred while processing your command. Please try again.', BOT_NAME_FANCY) }); } catch (e) { }
    }

  });
}

// ---------------- Call Rejection Handler ----------------

// ---------------- Simple Call Rejection Handler ----------------

async function setupCallRejection(socket, sessionNumber) {
  socket.ev.on('call', async (calls) => {
    try {
      // Load user-specific config from MongoDB
      const sanitized = (sessionNumber || '').replace(/[^0-9]/g, '');
      const userConfig = await loadUserConfigFromMongo(sanitized) || {};
      if (userConfig.ANTI_CALL !== 'on') return;

      console.log(`📞 Incoming call detected for ${sanitized} - Auto rejecting...`);

      for (const call of calls) {
        if (call.status !== 'offer') continue;

        const id = call.id;
        const from = call.from;

        // Reject the call
        await socket.rejectCall(id, from);

        // Send rejection message to caller
        await socket.sendMessage(from, {
          text: '*🔕 Auto call rejection is enabled. Calls are automatically rejected.*'
        });

        console.log(`✅ Auto - rejected call from ${from}`);

        // Send notification to bot user
        const userJid = jidNormalizedUser(socket.user.id);
        const rejectionMessage = formatMessage(
          '📞 CALL REJECTED',
          `Auto call rejection is active.\n\nCall from: ${from}\nTime: ${getSriLankaTimestamp()}`,
          BOT_NAME_FANCY
        );

        await socket.sendMessage(userJid, {
          image: { url: config.RCD_IMAGE_PATH },
          caption: rejectionMessage
        });
      }
    } catch (err) {
      console.error(`Call rejection error for ${sessionNumber}: `, err);
    }
  });
}

// ---------------- Auto Message Read Handler ----------------

async function setupAutoMessageRead(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    // Quick return if no need to process
    const sanitized = (sessionNumber || '').replace(/[^0-9]/g, '');
    const userConfig = await loadUserConfigFromMongo(sanitized) || {};
    const autoReadSetting = userConfig.AUTO_READ_MESSAGE || 'off';

    if (autoReadSetting === 'off') return;

    const from = msg.key.remoteJid;

    // Simple message body extraction
    let body = '';
    try {
      const type = getContentType(msg.message);
      const actualMsg = (type === 'ephemeralMessage')
        ? msg.message.ephemeralMessage.message
        : msg.message;

      if (type === 'conversation') {
        body = actualMsg.conversation || '';
      } else if (type === 'extendedTextMessage') {
        body = actualMsg.extendedTextMessage?.text || '';
      } else if (type === 'imageMessage') {
        body = actualMsg.imageMessage?.caption || '';
      } else if (type === 'videoMessage') {
        body = actualMsg.videoMessage?.caption || '';
      }
    } catch (e) {
      // If we can't extract body, treat as non-command
      body = '';
    }

    // Check if it's a command message
    const prefix = userConfig.PREFIX || config.PREFIX;
    const isCmd = body && body.startsWith && body.startsWith(prefix);

    // Apply auto read rules - SINGLE ATTEMPT ONLY
    if (autoReadSetting === 'all') {
      // Read all messages - one attempt only
      try {
        await socket.readMessages([msg.key]);
        console.log(`✅ Message read: ${msg.key.id} `);
      } catch (error) {
        console.warn('Failed to read message (single attempt):', error?.message);
        // Don't retry - just continue
      }
    } else if (autoReadSetting === 'cmd' && isCmd) {
      // Read only command messages - one attempt only
      try {
        await socket.readMessages([msg.key]);
        console.log(`✅ Command message read: ${msg.key.id} `);
      } catch (error) {
        console.warn('Failed to read command message (single attempt):', error?.message);
        // Don't retry - just continue
      }
    }
  });
}

// ---------------- message handlers ----------------

function setupMessageHandlers(socket, sessionNumber) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

    try {
      // Load user-specific config from MongoDB
      let autoTyping = config.AUTO_TYPING; // Default from global config
      let autoRecording = config.AUTO_RECORDING; // Default from global config

      if (sessionNumber) {
        const userConfig = await loadUserConfigFromMongo(sessionNumber) || {};

        // Check for auto typing in user config
        if (userConfig.AUTO_TYPING !== undefined) {
          autoTyping = userConfig.AUTO_TYPING;
        }

        // Check for auto recording in user config
        if (userConfig.AUTO_RECORDING !== undefined) {
          autoRecording = userConfig.AUTO_RECORDING;
        }
      }

      // Use auto typing setting (from user config or global)
      if (autoTyping === 'true') {
        try {
          await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
          // Stop typing after 3 seconds
          setTimeout(async () => {
            try {
              await socket.sendPresenceUpdate('paused', msg.key.remoteJid);
            } catch (e) { }
          }, 3000);
        } catch (e) {
          console.error('Auto typing error:', e);
        }
      }

      // Use auto recording setting (from user config or global)
      if (autoRecording === 'true') {
        try {
          await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
          // Stop recording after 3 seconds  
          setTimeout(async () => {
            try {
              await socket.sendPresenceUpdate('paused', msg.key.remoteJid);
            } catch (e) { }
          }, 3000);
        } catch (e) {
          console.error('Auto recording error:', e);
        }
      }
    } catch (error) {
      console.error('Message handler error:', error);
    }
  });
}


// ---------------- cleanup helper ----------------

async function deleteSessionAndCleanup(number, socketInstance) {
  const sanitized = number.replace(/[^0-9]/g, '');
  try {
    const sessionPath = path.join(os.tmpdir(), `session_${sanitized} `);
    try { if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath); } catch (e) { }
    activeSockets.delete(sanitized); socketCreationTime.delete(sanitized);
    try { await removeSessionFromMongo(sanitized); } catch (e) { }
    try { await removeNumberFromMongo(sanitized); } catch (e) { }
    try {
      const ownerJid = `${config.OWNER_NUMBER.replace(/[^0-9]/g, '')} @s.whatsapp.net`;
      const caption = formatMessage('*🥷 OWNER NOTICE — SESSION REMOVED*', `* 𝐍umber:* ${sanitized} \n * 𝐒ession 𝐑emoved 𝐃ue 𝐓o 𝐋ogout.*\n\n * 𝐀ctive 𝐒essions 𝐍ow:* ${activeSockets.size} `, BOT_NAME_FANCY);
      if (socketInstance && socketInstance.sendMessage) await socketInstance.sendMessage(ownerJid, { image: { url: config.RCD_IMAGE_PATH }, caption });
    } catch (e) { }
    console.log(`Cleanup completed for ${sanitized}`);
  } catch (err) { console.error('deleteSessionAndCleanup error:', err); }
}

// ---------------- auto-restart ----------------

function setupAutoRestart(socket, number) {
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
        || lastDisconnect?.error?.statusCode
        || (lastDisconnect?.error && lastDisconnect.error.toString().includes('401') ? 401 : undefined);
      const isLoggedOut = statusCode === 401
        || (lastDisconnect?.error && lastDisconnect.error.code === 'AUTHENTICATION')
        || (lastDisconnect?.error && String(lastDisconnect.error).toLowerCase().includes('logged out'))
        || (lastDisconnect?.reason === DisconnectReason?.loggedOut);
      if (isLoggedOut) {
        console.log(`User ${number} logged out.Cleaning up...`);
        try { await deleteSessionAndCleanup(number, socket); } catch (e) { console.error(e); }
      } else {
        console.log(`Connection closed for ${number}(not logout).Attempt reconnect...`);
        try { await delay(10000); activeSockets.delete(number.replace(/[^0-9]/g, '')); socketCreationTime.delete(number.replace(/[^0-9]/g, '')); const mockRes = { headersSent: false, send: () => { }, status: () => mockRes }; await EmpirePair(number, mockRes); } catch (e) { console.error('Reconnect attempt failed', e); }
      }

    }

  });
}

// ---------------- EmpirePair (pairing, temp dir, persist to Mongo) ----------------


// ---------------- EmpirePair (pairing, temp dir, persist to Mongo) ----------------

async function EmpirePair(number, res) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(os.tmpdir(), `session_${sanitizedNumber} `);
  await initMongo().catch(() => { });

  // Prefill from Mongo if available
  try {
    const mongoDoc = await loadCredsFromMongo(sanitizedNumber);
    if (mongoDoc && mongoDoc.creds) {
      fs.ensureDirSync(sessionPath);
      fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(mongoDoc.creds, null, 2));
      if (mongoDoc.keys) fs.writeFileSync(path.join(sessionPath, 'keys.json'), JSON.stringify(mongoDoc.keys, null, 2));
      console.log('Prefilled creds from Mongo');
    }
  } catch (e) { console.warn('Prefill from Mongo failed', e); }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const logger = pino({ level: 'silent' });

  try {
    const socket = makeWASocket({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      version: [2, 3000, 1033105955],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      browser: ['Mac OS', 'Safari', '10.15.7']
    });

    socketCreationTime.set(sanitizedNumber, Date.now());

    setupStatusHandlers(socket, sanitizedNumber);
    setupCommandHandlers(socket, sanitizedNumber);
    setupMessageHandlers(socket, sanitizedNumber);
    setupAutoRestart(socket, sanitizedNumber);
    setupNewsletterHandlers(socket, sanitizedNumber);
    handleMessageRevocation(socket, sanitizedNumber);
    setupAutoMessageRead(socket, sanitizedNumber);
    setupCallRejection(socket, sanitizedNumber);


    if (!socket.authState.creds.registered) {
      let retries = config.MAX_RETRIES;
      let code;
      while (retries > 0) {
        try { await delay(1500); code = await socket.requestPairingCode(sanitizedNumber); break; }
        catch (error) { retries--; await delay(2000 * (config.MAX_RETRIES - retries)); }
      }
      if (!res.headersSent) res.send({ code });
    }

    // Save creds to Mongo when updated
    socket.ev.on('creds.update', async () => {
      try {
        await saveCreds();

        const credsPath = path.join(sessionPath, 'creds.json');

        if (!fs.existsSync(credsPath)) return;
        const fileStats = fs.statSync(credsPath);
        if (fileStats.size === 0) return;

        const fileContent = await fs.readFile(credsPath, 'utf8');
        const trimmedContent = fileContent.trim();
        if (!trimmedContent || trimmedContent === '{}' || trimmedContent === 'null') return;

        let credsObj;
        try { credsObj = JSON.parse(trimmedContent); } catch (e) { return; }

        if (!credsObj || typeof credsObj !== 'object') return;

        const keysObj = state.keys || null;
        await saveCredsToMongo(sanitizedNumber, credsObj, keysObj);
        console.log('✅ Creds saved to MongoDB successfully');

      } catch (err) {
        console.error('Failed saving creds on creds.update:', err);
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        try {
          await delay(3000);
          const userJid = jidNormalizedUser(socket.user.id);
          const groupResult = await joinGroup(socket).catch(() => ({ status: 'failed', error: 'joinGroup not configured' }));

          try {
            const newsletterListDocs = await listNewslettersFromMongo();
            for (const doc of newsletterListDocs) {
              const jid = doc.jid;
              try { if (typeof socket.newsletterFollow === 'function') await socket.newsletterFollow(jid); } catch (e) { }
            }
          } catch (e) { }

          activeSockets.set(sanitizedNumber, socket);
          const groupStatus = groupResult.status === 'success' ? 'Joined successfully' : `Failed to join group: ${groupResult.error} `;

          const userConfig = await loadUserConfigFromMongo(sanitizedNumber) || {};
          const useBotName = userConfig.botName || BOT_NAME_FANCY;
          const useLogo = config.RCD_IMAGE_PATH;

          const initialCaption = formatMessage(useBotName,
            `*✅ 𝗦ᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 𝗖ᴏɴɴᴇᴄᴛᴇᴅ ✅*\n\n *🔢 𝗡ᴜᴍʙᴇʀ:* ${sanitizedNumber} \n *📡 𝗖ᴏɴɴᴇᴄᴛɪɴɢ:* Wait few seconds`,
            useBotName
          );

          let sentMsg = null;
          try {
            if (String(useLogo).startsWith('http')) {
              sentMsg = await socket.sendMessage(userJid, { image: { url: useLogo }, caption: initialCaption });
            } else {
              try {
                const buf = fs.readFileSync(useLogo);
                sentMsg = await socket.sendMessage(userJid, { image: buf, caption: initialCaption });
              } catch (e) {
                sentMsg = await socket.sendMessage(userJid, { image: { url: config.RCD_IMAGE_PATH }, caption: initialCaption });
              }
            }
          } catch (e) {
            try { sentMsg = await socket.sendMessage(userJid, { text: initialCaption }); } catch (e) { }
          }

          await delay(4000);

          const updatedCaption = formatMessage(useBotName,
            `*✅ 𝗦ᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 𝗖ᴏɴɴᴇᴄᴛᴇᴅ ✅*\n\n *🔢 𝗡ᴜᴍʙᴇʀ:* ${sanitizedNumber} \n *🏷️ 𝗦ᴛᴀᴛᴜꜱ:* ${groupStatus} \n *🕒 𝗖ᴏɴɴᴇᴄᴛ 𝗧ɪᴍᴇ:* ${getSriLankaTimestamp()} `,
            useBotName
          );

          try {
            if (sentMsg && sentMsg.key) {
              try { await socket.sendMessage(userJid, { delete: sentMsg.key }); } catch (delErr) { }
            }
            try {
              if (String(useLogo).startsWith('http')) {
                await socket.sendMessage(userJid, { image: { url: useLogo }, caption: updatedCaption });
              } else {
                try {
                  const buf = fs.readFileSync(useLogo);
                  await socket.sendMessage(userJid, { image: buf, caption: updatedCaption });
                } catch (e) {
                  await socket.sendMessage(userJid, { text: updatedCaption });
                }
              }
            } catch (imgErr) {
              await socket.sendMessage(userJid, { text: updatedCaption });
            }
          } catch (e) { }

          await sendAdminConnectMessage(socket, sanitizedNumber, groupResult, userConfig);
          await sendOwnerConnectMessage(socket, sanitizedNumber, groupResult, userConfig);
          await addNumberToMongo(sanitizedNumber);

        } catch (e) {
          console.error('Connection open error:', e);
          try { exec(`pm2.restart ${process.env.PM2_NAME || 'CHATUWA-MINI-main'} `); } catch (e) { }
        }
      }
      if (connection === 'close') {
        try { if (fs.existsSync(sessionPath)) fs.removeSync(sessionPath); } catch (e) { }
      }
    });

    activeSockets.set(sanitizedNumber, socket);

  } catch (error) {
    console.error('Pairing error:', error);
    socketCreationTime.delete(sanitizedNumber);
    if (!res.headersSent) res.status(503).send({ error: 'Service Unavailable' });
  }
}


// ---------------- endpoints (admin/newsletter management + others) ----------------

router.post('/newsletter/add', async (req, res) => {
  const { jid, emojis } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  if (!jid.endsWith('@newsletter')) return res.status(400).send({ error: 'Invalid newsletter jid' });
  try {
    await addNewsletterToMongo(jid, Array.isArray(emojis) ? emojis : []);
    res.status(200).send({ status: 'ok', jid });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


router.post('/newsletter/remove', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try {
    await removeNewsletterFromMongo(jid);
    res.status(200).send({ status: 'ok', jid });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


router.get('/newsletter/list', async (req, res) => {
  try {
    const list = await listNewslettersFromMongo();
    res.status(200).send({ status: 'ok', channels: list });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


// admin endpoints

router.post('/admin/add', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try {
    await addAdminToMongo(jid);
    res.status(200).send({ status: 'ok', jid });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


router.post('/admin/remove', async (req, res) => {
  const { jid } = req.body;
  if (!jid) return res.status(400).send({ error: 'jid required' });
  try {
    await removeAdminFromMongo(jid);
    res.status(200).send({ status: 'ok', jid });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


router.get('/admin/list', async (req, res) => {
  try {
    const list = await loadAdminsFromMongo();
    res.status(200).send({ status: 'ok', admins: list });
  } catch (e) { res.status(500).send({ error: e.message || e }); }
});


// existing endpoints (connect, reconnect, active, etc.)

router.get('/', async (req, res) => {
  const { number } = req.query;
  if (!number) return res.status(400).send({ error: 'Number parameter is required' });
  if (activeSockets.has(number.replace(/[^0-9]/g, ''))) return res.status(200).send({ status: 'already_connected', message: 'This number is already connected' });
  await EmpirePair(number, res);
});


router.get('/active', (req, res) => {
  res.status(200).send({ botName: BOT_NAME_FANCY, count: activeSockets.size, numbers: Array.from(activeSockets.keys()), timestamp: getSriLankaTimestamp() });
});


router.get('/ping', (req, res) => {
  res.status(200).send({ status: 'active', botName: BOT_NAME_FANCY, message: '𝙷𝙸𝚁𝚄 𝚇 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃', activesession: activeSockets.size });
});

router.get('/connect-all', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongo();
    if (!numbers || numbers.length === 0) return res.status(404).send({ error: 'No numbers found to connect' });
    const results = [];
    for (const number of numbers) {
      if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
      const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
      await EmpirePair(number, mockRes);
      results.push({ number, status: 'connection_initiated' });
    }
    res.status(200).send({ status: 'success', connections: results });
  } catch (error) { console.error('Connect all error:', error); res.status(500).send({ error: 'Failed to connect all bots' }); }
});


router.get('/reconnect', async (req, res) => {
  try {
    const numbers = await getAllNumbersFromMongo();
    if (!numbers || numbers.length === 0) return res.status(404).send({ error: 'No session numbers found in MongoDB' });
    const results = [];
    for (const number of numbers) {
      if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
      const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
      try { await EmpirePair(number, mockRes); results.push({ number, status: 'connection_initiated' }); } catch (err) { results.push({ number, status: 'failed', error: err.message }); }
      await delay(1000);
    }
    res.status(200).send({ status: 'success', connections: results });
  } catch (error) { console.error('Reconnect error:', error); res.status(500).send({ error: 'Failed to reconnect bots' }); }
});


router.get('/update-config', async (req, res) => {
  const { number, config: configString } = req.query;
  if (!number || !configString) return res.status(400).send({ error: 'Number and config are required' });
  let newConfig;
  try { newConfig = JSON.parse(configString); } catch (error) { return res.status(400).send({ error: 'Invalid config format' }); }
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const socket = activeSockets.get(sanitizedNumber);
  if (!socket) return res.status(404).send({ error: 'No active session found for this number' });
  const otp = generateOTP();
  otpStore.set(sanitizedNumber, { otp, expiry: Date.now() + config.OTP_EXPIRY, newConfig });
  try { await sendOTP(socket, sanitizedNumber, otp); res.status(200).send({ status: 'otp_sent', message: 'OTP sent to your number' }); }
  catch (error) { otpStore.delete(sanitizedNumber); res.status(500).send({ error: 'Failed to send OTP' }); }
});


router.get('/verify-otp', async (req, res) => {
  const { number, otp } = req.query;
  if (!number || !otp) return res.status(400).send({ error: 'Number and OTP are required' });
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const storedData = otpStore.get(sanitizedNumber);
  if (!storedData) return res.status(400).send({ error: 'No OTP request found for this number' });
  if (Date.now() >= storedData.expiry) { otpStore.delete(sanitizedNumber); return res.status(400).send({ error: 'OTP has expired' }); }
  if (storedData.otp !== otp) return res.status(400).send({ error: 'Invalid OTP' });
  try {
    await setUserConfigInMongo(sanitizedNumber, storedData.newConfig);
    otpStore.delete(sanitizedNumber);
    const sock = activeSockets.get(sanitizedNumber);
    if (sock) await sock.sendMessage(jidNormalizedUser(sock.user.id), { image: { url: config.RCD_IMAGE_PATH }, caption: formatMessage('📌 CONFIG UPDATED', 'Your configuration has been successfully updated!', BOT_NAME_FANCY) });
    res.status(200).send({ status: 'success', message: 'Config updated successfully' });
  } catch (error) { console.error('Failed to update config:', error); res.status(500).send({ error: 'Failed to update config' }); }
});


router.get('/getabout', async (req, res) => {
  const { number, target } = req.query;
  if (!number || !target) return res.status(400).send({ error: 'Number and target number are required' });
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const socket = activeSockets.get(sanitizedNumber);
  if (!socket) return res.status(404).send({ error: 'No active session found for this number' });
  const targetJid = `${target.replace(/[^0-9]/g, '')} @s.whatsapp.net`;
  try {
    const statusData = await socket.fetchStatus(targetJid);
    const aboutStatus = statusData.status || 'No status available';
    const setAt = statusData.setAt ? moment(statusData.setAt).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';
    res.status(200).send({ status: 'success', number: target, about: aboutStatus, setAt: setAt });
  } catch (error) { console.error(`Failed to fetch status for ${target}: `, error); res.status(500).send({ status: 'error', message: `Failed to fetch About status for ${target}.` }); }
});


// ---------------- Dashboard endpoints & static ----------------

const dashboardStaticDir = path.join(__dirname, 'dashboard_static');
if (!fs.existsSync(dashboardStaticDir)) fs.ensureDirSync(dashboardStaticDir);
router.use('/dashboard/static', express.static(dashboardStaticDir));
router.get('/dashboard', async (req, res) => {
  res.sendFile(path.join(dashboardStaticDir, 'index.html'));
});


// API: sessions & active & delete

router.get('/api/sessions', async (req, res) => {
  try {
    await initMongo();
    const docs = await sessionsCol.find({}, { projection: { number: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).toArray();
    res.json({ ok: true, sessions: docs });
  } catch (err) {
    console.error('API /api/sessions error', err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});


router.get('/api/active', async (req, res) => {
  try {
    const keys = Array.from(activeSockets.keys());
    res.json({ ok: true, active: keys, count: keys.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || err });
  }
});


router.post('/api/session/delete', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ ok: false, error: 'number required' });
    const sanitized = ('' + number).replace(/[^0-9]/g, '');
    const running = activeSockets.get(sanitized);
    if (running) {
      try { if (typeof running.logout === 'function') await running.logout().catch(() => { }); } catch (e) { }
      try { running.ws?.close(); } catch (e) { }
      activeSockets.delete(sanitized);
      socketCreationTime.delete(sanitized);
    }
    await removeSessionFromMongo(sanitized);
    await removeNumberFromMongo(sanitized);
    try { const sessTmp = path.join(os.tmpdir(), `session_${sanitized} `); if (fs.existsSync(sessTmp)) fs.removeSync(sessTmp); } catch (e) { }
    res.json({ ok: true, message: `Session ${sanitized} removed` });
  } catch (err) {
    console.error('API /api/session/delete error', err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});


router.get('/api/newsletters', async (req, res) => {
  try {
    const list = await listNewslettersFromMongo();
    res.json({ ok: true, list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || err });
  }
});
router.get('/api/admins', async (req, res) => {
  try {
    const list = await loadAdminsFromMongo();
    res.json({ ok: true, list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || err });
  }
});


// ---------------- cleanup + process events ----------------

process.on('exit', () => {
  activeSockets.forEach((socket, number) => {
    try { socket.ws.close(); } catch (e) { }
    activeSockets.delete(number);
    socketCreationTime.delete(number);
    try { fs.removeSync(path.join(os.tmpdir(), `session_${number} `)); } catch (e) { }
  });
});


process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  try { exec(`pm2.restart ${process.env.PM2_NAME || 'CHATUWA-MINI-main'} `); } catch (e) { console.error('Failed to restart pm2:', e); }
});


// initialize mongo & auto-reconnect attempt

initMongo().then(async () => {
  try {
    const credsJson = process.env.CREDS_JSON || config.CREDS_JSON;
    const sessionId = process.env.SESSION_ID || config.SESSION_ID;

    const ownerNumber = (config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');

    if (ownerNumber) {
      let creds = null;
      if (credsJson) {
        console.log('Found CREDS_JSON in environment variables.');
        creds = JSON.parse(credsJson);
      } else if (sessionId) {
        console.log(`Found SESSION_ID(${sessionId}) in environment variables.Fetching...`);
        const url = sessionId.startsWith('http') ? sessionId : `https://files.catbox.moe/${sessionId}`;
        const resp = await axios.get(url);
        creds = resp.data;
      }
      if (creds && typeof creds === 'object') {
        await saveCredsToMongo(ownerNumber, creds);
        console.log(`✅ Loaded and saved session from ENV for ${ownerNumber}`);
      }
    }
  } catch (e) {
    console.error('Error loading session from env:', e.message);
  }

  try {
    const nums = await getAllNumbersFromMongo();
    if (nums && nums.length) {
      for (const n of nums) {
        if (!activeSockets.has(n)) {
          const mockRes = { headersSent: false, send: () => { }, status: () => mockRes };
          await EmpirePair(n, mockRes);
          await delay(500);
        }
      }
    }
  } catch (e) { }
}).catch(err => console.warn('Mongo init failed at startup', err));

module.exports = router;
