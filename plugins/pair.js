const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    // auto join/follow
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('Bot connected successfully! 🚀');
            
            // Auto group join
            await autoJoinGroup(sock);
            
            // Auto channel follow (newsletter)
            await autoFollowChannel(sock);
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        }
    });

    return sock;
}

// Auto group join function
async function autoJoinGroup(sock) {
    try {
        const groupInviteLink = 'https://chat.whatsapp.com/YOUR_INVITE_CODE';
        
        // Extract from invite link
        const inviteCode = groupInviteLink.split('https://chat.whatsapp.com/')[1];
        
        // Group එකට join කරන්න
        const response = await sock.groupAcceptInvite(inviteCode);
        console.log('✅ Auto joined group:', response);
        
    } catch (error) {
        console.log('❌ Auto group join failed:', error.message);
        // Already here
        if (error.message.includes('already')) {
            console.log('Already in the group');
        }
    }
}

// Auto channel follow function (newsletters)
async function autoFollowChannel(sock) {
    try {
        // Channel invite link
        const channelInviteLink = 'https://whatsapp.com/channel/YOUR_CHANNEL_CODE';
        
        // Channel code extract 
        const channelCode = channelInviteLink.split('channel/')[1];
        
        // Channel follow
        await sock.newsletterFollow(channelCode);
        console.log('✅ Auto followed channel');
        
    } catch (error) {
        console.log('❌ Auto channel follow failed:', error.message);
    }
}

connectToWhatsApp();
Multiple groups/channels 
async function autoJoinGroup(sock) {
    const groupLinks = [
        'https://chat.whatsapp.com/CODE1',
        'https://chat.whatsapp.com/CODE2',
        'https://chat.whatsapp.com/CODE3'
    ];
    
    for (const link of groupLinks) {
        try {
            const code = link.split('https://chat.whatsapp.com/')[1];
            await sock.groupAcceptInvite(code);
            console.log('✅ Joined:', link);
            await delay(2000); // Rate limit avoid
        } catch (err) {
            console.log('❌ Failed:', link, err.message);
        }
    }
}

async function autoFollowChannel(sock) {
    const channelLinks = [
        'https://whatsapp.com/channel/CODE1',
        'https://whatsapp.com/channel/CODE2'
    ];
    
    for (const link of channelLinks) {
        try {
            const code = link.split('channel/')[1];
            await sock.newsletterFollow(code);
            console.log('✅ Followed:', link);
            await delay(2000);
        } catch (err) {
            console.log('❌ Failed:', link, err.message);
        }
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
