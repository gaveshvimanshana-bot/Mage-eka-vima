const { cmd } = require("../command");
const axios = require("axios");

// Extract file ID from Google Drive URL
const extractFileId = (url) => {
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{25,})/,           // /d/FILE_ID
    /id=([a-zA-Z0-9_-]{25,})/,            // id=FILE_ID
    /\/file\/d\/([a-zA-Z0-9_-]{25,})/,    // /file/d/FILE_ID
    /\/open\?id=([a-zA-Z0-9_-]{25,})/,    // /open?id=FILE_ID
    /\/uc\?id=([a-zA-Z0-9_-]{25,})/,      // /uc?id=FILE_ID
    /([a-zA-Z0-9_-]{25,})/                // Just the ID
  ];

  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// ==================== GDRIVE DOWNLOAD ====================
cmd({
  pattern: "gdrive",
  alias: ["gd", "googledrive", "drive"],
  react: "📥",
  desc: "Download files from Google Drive",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply(`📥 *Google Drive Downloader*

❌ *Please provide Google Drive URL!*

📌 *Supported formats:*
• https://drive.google.com/file/d/FILE_ID/view
• https://drive.google.com/open?id=FILE_ID
• https://drive.google.com/uc?id=FILE_ID

📌 *Examples:*
• \`.gdrive https://drive.google.com/file/d/1ABC...xyz/view\`
• \`.gdrive 1ABC...xyz\` (just file ID)

⚠️ *Note:* File must be "Anyone with the link" access

> _Vima-MD Drive Downloader_`);

    await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Extract file ID
    const fileId = extractFileId(q);
    if (!fileId) {
      return reply("❌ *Invalid Google Drive URL!*\n\nPlease check the URL and try again.");
    }

    console.log("Extracted File ID:", fileId);

    // Method 1: Direct download URL (small files)
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Method 2: With confirm parameter (large files)
    const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

    await reply("🔍 *Checking file...*");

    // Try to get file info first
    let fileName = `gdrive_${fileId}`;
    let fileSize = 0;
    let downloadUrl = directUrl;
    let isLargeFile = false;

    try {
      // Head request to check file
      const headResponse = await axios.head(directUrl, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400 || status === 405
      });

      // Check if we got redirect (large file warning)
      if (headResponse.headers.location && headResponse.headers.location.includes('confirm')) {
        isLargeFile = true;
        downloadUrl = confirmUrl;
      }

      // Try to get filename from headers
      const contentDisposition = headResponse.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }
      }

      fileSize = parseInt(headResponse.headers['content-length']) || 0;

    } catch (err) {
      console.log("Head request failed, trying confirm URL:", err.message);
      downloadUrl = confirmUrl;
    }

    // If large file or head failed, try confirm URL
    if (isLargeFile || fileSize === 0) {
      try {
        const confirmResponse = await axios.head(confirmUrl, {
          timeout: 15000,
          maxRedirects: 5
        });

        const contentDisposition = confirmResponse.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            fileName = filenameMatch[1];
          }
        }

        fileSize = parseInt(confirmResponse.headers['content-length']) || 0;
        downloadUrl = confirmUrl;

      } catch (err) {
        console.log("Confirm URL also failed:", err.message);
      }
    }

    // Format file size
    let sizeText = "Unknown";
    if (fileSize > 0) {
      if (fileSize > 1024 * 1024 * 1024) {
        sizeText = (fileSize / (1024 * 1024 * 1024)).toFixed(2) + " GB";
      } else if (fileSize > 1024 * 1024) {
        sizeText = (fileSize / (1024 * 1024)).toFixed(2) + " MB";
      } else {
        sizeText = (fileSize / 1024).toFixed(2) + " KB";
      }
    }

    await reply(`📄 *File Found!*

📛 *Name:* ${fileName}
📦 *Size:* ${sizeText}
🆔 *ID:* ${fileId.substring(0, 15)}...

⏳ *Starting download...*`);

    // Check if too large for WhatsApp
    if (fileSize > 100 * 1024 * 1024) {
      return reply(`⚠️ *File too large for WhatsApp!*

📦 *Size:* ${sizeText}
📛 *Name:* ${fileName}

📥 *Direct Download Link:*
${downloadUrl}

💡 *Tip:* Use this link with a download manager`);
    }

    // Download file
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minutes
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      onDownloadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Download progress: ${percent}%`);
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Empty file received");
    }

    // Save temporarily
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join('/tmp', `gdrive_${Date.now()}_${fileName}`);

    // If no extension, try to guess from content-type
    let finalFileName = fileName;
    if (!fileName.includes('.')) {
      const contentType = response.headers['content-type'];
      const ext = getExtensionFromMime(contentType);
      finalFileName = `${fileName}${ext}`;
    }

    fs.writeFileSync(tempFile, response.data);

    // Detect mime type
    const mimeType = response.headers['content-type'] || 'application/octet-stream';

    // Send file
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    const isAudio = mimeType.startsWith('audio/');

    if (isImage) {
      await bot.sendMessage(from, {
        image: { url: tempFile },
        caption: `📥 *Downloaded from Google Drive*

📛 ${finalFileName}
📦 ${(response.data.length / 1024 / 1024).toFixed(2)} MB

> _Vima-MD Drive Downloader_`
      }, { quoted: mek });
    } else if (isVideo) {
      await bot.sendMessage(from, {
        video: { url: tempFile },
        caption: `📥 *Downloaded from Google Drive*

📛 ${finalFileName}
📦 ${(response.data.length / 1024 / 1024).toFixed(2)} MB

> _Vima-MD Drive Downloader_`,
        mimetype: mimeType
      }, { quoted: mek });
    } else if (isAudio) {
      await bot.sendMessage(from, {
        audio: { url: tempFile },
        caption: `📥 ${finalFileName}`,
        mimetype: mimeType
      }, { quoted: mek });
    } else {
      // Document
      await bot.sendMessage(from, {
        document: { url: tempFile },
        fileName: finalFileName,
        mimetype: mimeType,
        caption: `📥 *Downloaded from Google Drive*

📛 ${finalFileName}
📦 ${(response.data.length / 1024 / 1024).toFixed(2)} MB

> _Vima-MD Drive Downloader_`
      }, { quoted: mek });
    }

    // Cleanup
    fs.unlinkSync(tempFile);

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("GDrive error:", err.message);
    
    if (err.response?.status === 404) {
      reply("❌ *File not found!*\n\nCheck if:\n• File ID is correct\n• File is shared publicly\n• File hasn't been deleted");
    } else if (err.response?.status === 403) {
      reply("❌ *Access denied!*\n\nFile is not shared publicly. Owner must set to \"Anyone with the link\".");
    } else if (err.code === 'ECONNABORTED') {
      reply("⏱️ *Download timeout!*\n\nFile is too large or connection is slow. Try direct link instead.");
    } else {
      reply(`❌ *Download failed!*\n\nError: ${err.message}\n\n💡 Try using direct link with browser.`);
    }
    
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// Helper function to get extension from MIME type
function getExtensionFromMime(mimeType) {
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/rar': '.rar',
    'application/x-rar-compressed': '.rar',
    'application/x-zip-compressed': '.zip'
  };
  return mimeMap[mimeType] || '';
}

// ==================== GDRIVE INFO ====================
cmd({
  pattern: "gdinfo",
  alias: ["driveinfo", "gdfolder"],
  react: "📂",
  desc: "Get Google Drive file/folder info",
  category: "download",
  filename: __filename,
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide Google Drive URL!*");

    const fileId = extractFileId(q);
    if (!fileId) return reply("❌ *Invalid URL!*");

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Try to get info using direct link
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios.head(directUrl, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    let fileName = "Unknown";
    let fileSize = 0;

    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) fileName = match[1];
    }

    fileSize = parseInt(response.headers['content-length']) || 0;

    let sizeText = "Unknown";
    if (fileSize > 0) {
      sizeText = fileSize > 1024 * 1024 
        ? (fileSize / (1024 * 1024)).toFixed(2) + " MB"
        : (fileSize / 1024).toFixed(2) + " KB";
    }

    const infoText = `📂 *Google Drive File Info*

📛 *Name:* ${fileName}
📦 *Size:* ${sizeText}
🆔 *File ID:* ${fileId.substring(0, 20)}...

📥 *Download Link:*
https://drive.google.com/uc?export=download&id=${fileId}

💡 *Use .gdrive <url> to download*`;

    await reply(infoText);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    reply("❌ *Failed to get file info!*");
  }
});

// ==================== GDRIVE HELP ====================
cmd({
  pattern: "gdhelp",
  alias: ["drivehelp", "gdtutorial"],
  react: "❓",
  desc: "How to use Google Drive downloader",
  category: "download",
  filename: __filename,
}, async (bot, mek, m, { reply, from }) => {
  const helpText = `📥 *Google Drive Downloader Help*

*How to download:*

1️⃣ *Get Shareable Link:*
   • Go to drive.google.com
   • Right-click file → Share
   • Change to "Anyone with the link"
   • Copy link

2️⃣ *Use Command:*
   • \`.gdrive <link>\`
   • Or: \`.gdrive <file_id>\`

3️⃣ *Wait for download:*
   • Bot will send file directly
   • Max size: 100MB (WhatsApp limit)

*Supported Files:*
📄 Documents (PDF, DOC, XLS)
🖼️ Images (JPG, PNG, GIF)
🎬 Videos (MP4, WEBM)
🎵 Audio (MP3, M4A)
📦 Archives (ZIP, RAR)

*Commands:*
• \`.gdrive <url>\` - Download file
• \`.gdinfo <url>\` - Get file info
• \`.gdhelp\` - Show this help

⚠️ *Important:*
• File must be publicly shared
• Private files cannot be downloaded
• Large files get direct link instead

> _Vima-MD Drive Downloader_`;

  await reply(helpText);
});
