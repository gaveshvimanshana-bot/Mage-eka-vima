const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

// ==================== MAIN PAST PAPER COMMAND ====================
cmd({
  pattern: "paper",
  alias: ["pastpaper", "alpaper", "olpaper", "exam"],
  react: "📚",
  desc: "Download real GCE A/L & O/L past papers from official sources",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply(`📚 *REAL Past Paper Downloader*

❌ *Please provide details!*

📌 *Format:* \`.paper <subject> <year> <al/ol> [medium]\`

📝 *Examples:*
• \`.paper maths 2022 al\`
• \`.paper physics 2021 ol\`  
• \`.paper chemistry 2020 al sinhala\`
• \`.paper bio 2019 ol english\`

📋 *Popular Subjects:*
🔬 Science: maths, physics, chemistry, biology, ict
💼 Commerce: accounting, business, econ
🎨 Arts: sinhala, english, history, geography

🌐 *Sources:* e-thaksalawa.gov.lk | pastpapers.wiki | e-kalvi.com

> _Vima-MD Education Bot_`);

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Parse query
    const args = q.toLowerCase().trim().split(' ');
    const subjectInput = args[0];
    const year = args[1] || '2022';
    const type = args[2] || 'al';
    const medium = args[3] || 'english';

    // Validate
    if (!['al', 'ol'].includes(type)) {
      return reply("❌ *Invalid type! Use 'al' or 'ol'*");
    }

    // Map subject names
    const subjectMap = {
      'maths': 'mathematics', 'math': 'mathematics', 'combined-maths': 'combined-mathematics',
      'physics': 'physics', 'chem': 'chemistry', 'chemistry': 'chemistry',
      'bio': 'biology', 'biology': 'biology', 'zoology': 'zoology', 'botany': 'botany',
      'ict': 'ict', 'it': 'ict', 'git': 'git',
      'econ': 'economics', 'economics': 'economics',
      'acc': 'accounting', 'accounting': 'accounting',
      'bs': 'business', 'business': 'business-studies', 'bst': 'business-studies',
      'sinhala': 'sinhala', 'sin': 'sinhala',
      'eng': 'english', 'english': 'english',
      'tamil': 'tamil',
      'history': 'history', 'geo': 'geography', 'geography': 'geography',
      'art': 'art', 'music': 'music', 'dance': 'dance', 'drama': 'drama',
      'agri': 'agriculture', 'agriculture': 'agriculture',
      'et': 'engineering-technology', 'bt': 'bio-technology', 'st': 'science-technology'
    };

    const subject = subjectMap[subjectInput] || subjectInput;

    // Search all sources
    await reply(`🔍 *Searching...*\n\n📖 Subject: ${subject}\n📅 Year: ${year}\n🏫 Type: ${type.toUpperCase()}\n🌐 Medium: ${medium}\n\n⏳ Checking official sources...`);

    let paperData = null;
    let source = '';

    // Try Source 1: pastpapers.wiki (most reliable)
    try {
      paperData = await searchPastPapersWiki(subject, year, type, medium);
      if (paperData.found) source = 'pastpapers.wiki';
    } catch (e) {
      console.log("Wiki search failed:", e.message);
    }

    // Try Source 2: e-kalvi.com
    if (!paperData || !paperData.found) {
      try {
        paperData = await searchEKalvi(subject, year, type, medium);
        if (paperData.found) source = 'e-kalvi.com';
      } catch (e) {
        console.log("E-kalvi search failed:", e.message);
      }
    }

    // Try Source 3: govdoc.lk
    if (!paperData || !paperData.found) {
      try {
        paperData = await searchGovDoc(subject, year, type, medium);
        if (paperData.found) source = 'govdoc.lk';
      } catch (e) {
        console.log("GovDoc search failed:", e.message);
      }
    }

    // Try Source 4: e-thaksalawa (government - needs login usually)
    if (!paperData || !paperData.found) {
      paperData = {
        found: false,
        alternative: `https://e-thaksalawa.moe.gov.lk/lcms/course/index.php?categoryid=${type === 'al' ? '78' : '79'}`,
        message: 'Direct download not available. Visit e-thaksalawa.gov.lk (requires login)'
      };
    }

    if (!paperData.found && !paperData.alternative) {
      return reply(`❌ *Paper not found in online sources!*

🔍 *Searched:* ${subject} ${year} ${type.toUpperCase()} (${medium})

💡 *Try:*
• Different year (2015-2024)
• Check spelling: \`maths\` not \`mathematics\`
• Visit: https://pastpapers.wiki

📚 *Official Sources:*
• e-thaksalawa.moe.gov.lk [^32^]
• pastpapers.wiki [^31^]
• e-kalvi.com [^21^]`);
    }

    if (!paperData.found && paperData.alternative) {
      return reply(`⚠️ *Direct download not available*

📖 *Paper:* ${subject} ${year} ${type.toUpperCase()}

🔗 *Visit official source:*
${paperData.alternative}

📥 *Download manually from:*
• https://pastpapers.wiki
• https://e-kalvi.com
• https://govdoc.lk [^25^]`);
    }

    // Found paper - send info
    await reply(`📚 *Paper Found!*

📖 *Subject:* ${paperData.subject || subject}
📅 *Year:* ${paperData.year || year}
🏫 *Type:* ${type.toUpperCase()}
🌐 *Medium:* ${paperData.medium || medium}
📄 *Title:* ${paperData.title || 'GCE ' + type.toUpperCase() + ' ' + subject}
🌐 *Source:* ${source}

⏳ *Preparing download...*`);

    // Check if we have direct URL
    if (!paperData.url) {
      return reply(`⚠️ *Link found but direct download unavailable*

🔗 *Visit:* ${paperData.pageUrl || paperData.alternative || 'https://pastpapers.wiki'}

💡 *Bot cannot download from this source due to restrictions.*`);
    }

    // Try to download and send
    try {
      await bot.sendMessage(from, { react: { text: "⬇️", key: mek.key } });
      
      // Check file size first (head request)
      const headResponse = await axios.head(paperData.url, {
        timeout: 10000,
        validateStatus: () => true
      });

      const contentLength = headResponse.headers['content-length'];
      const sizeMB = contentLength ? (contentLength / 1024 / 1024).toFixed(2) : 'Unknown';

      await reply(`📊 *File Info:*
📦 Size: ${sizeMB} MB
📄 Type: PDF

⏳ Downloading...`);

      // If too big, send link only
      if (contentLength && contentLength > 45 * 1024 * 1024) {
        await reply(`⚠️ *File too large for WhatsApp (${sizeMB} MB)*

📥 *Direct Download Link:*
${paperData.url}

🔗 *Source Page:*
${paperData.pageUrl || 'N/A'}`);
      } else {
        // Download file
        const response = await axios.get(paperData.url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/pdf'
          }
        });

        // Save temporarily
        const fs = require('fs');
        const path = require('path');
        const tempFile = path.join('/tmp', `paper_${Date.now()}.pdf`);
        fs.writeFileSync(tempFile, response.data);

        // Send document
        await bot.sendMessage(from, {
          document: { url: tempFile },
          fileName: `${paperData.filename || type + '_' + subject + '_' + year}.pdf`,
          mimetype: "application/pdf",
          caption: `📚 *GCE ${type.toUpperCase()} Past Paper*

📖 ${paperData.title || subject}
📅 ${year}
🌐 ${paperData.medium || medium}
🌐 Source: ${source}

> _Downloaded by Vima-MD_`
        }, { quoted: mek });

        // Cleanup
        fs.unlinkSync(tempFile);
      }

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (downloadErr) {
      console.error("Download error:", downloadErr);
      await reply(`⚠️ *Download failed!*

🔗 *Try manual download:*
${paperData.url || paperData.pageUrl}

📄 *Paper:* ${paperData.title || subject + ' ' + year}`);
    }

  } catch (err) {
    console.error("Paper command error:", err);
    reply("❌ *An error occurred! Please try again later.*");
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ==================== SEARCH FUNCTIONS ====================

async function searchPastPapersWiki(subject, year, type, medium) {
  try {
    // Construct search URL for pastpapers.wiki
    const searchUrl = `https://pastpapers.wiki/${type}-level-${subject.replace(/-/g, '-')}-${year}-past-paper/`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: (status) => status < 500
    });

    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      
      // Look for PDF links
      let pdfUrl = null;
      let title = '';
      
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text();
        
        if (href && href.includes('.pdf')) {
          // Check if matches medium
          const lowerText = text.toLowerCase();
          if (lowerText.includes(medium) || lowerText.includes('download')) {
            pdfUrl = href.startsWith('http') ? href : `https://pastpapers.wiki${href}`;
            title = text;
            return false;
          }
        }
      });

      // Alternative: look for download buttons
      if (!pdfUrl) {
        $('a[href*="download"]').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('.pdf')) {
            pdfUrl = href.startsWith('http') ? href : `https://pastpapers.wiki${href}`;
            title = $(elem).text() || 'Download';
            return false;
          }
        });
      }

      if (pdfUrl) {
        return {
          found: true,
          subject: subject,
          year: year,
          type: type,
          medium: medium,
          title: title || `GCE ${type.toUpperCase()} ${subject} ${year}`,
          url: pdfUrl,
          pageUrl: searchUrl,
          filename: `${type.toUpperCase()}_${subject}_${year}_${medium}`
        };
      }
    }

    return { found: false };
  } catch (err) {
    console.error("Wiki search error:", err.message);
    return { found: false };
  }
}

async function searchEKalvi(subject, year, type, medium) {
  try {
    // e-kalvi.com search pattern
    const searchQuery = `${type} ${subject} ${year} past paper`;
    const searchUrl = `https://e-kalvi.com/?s=${encodeURIComponent(searchQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Find first result
    const firstLink = $('article a').first().attr('href');
    
    if (firstLink) {
      // Visit the post page
      const postResponse = await axios.get(firstLink, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $post = cheerio.load(postResponse.data);
      
      // Look for PDF links
      let pdfUrl = null;
      $post('a').each((i, elem) => {
        const href = $post(elem).attr('href');
        if (href && href.includes('.pdf')) {
          pdfUrl = href;
          return false;
        }
      });

      if (pdfUrl) {
        return {
          found: true,
          subject: subject,
          year: year,
          type: type,
          medium: medium,
          title: $post('h1').text() || `GCE ${type.toUpperCase()} ${subject} ${year}`,
          url: pdfUrl,
          pageUrl: firstLink,
          filename: `${type.toUpperCase()}_${subject}_${year}_eKalvi`
        };
      }
    }

    return { found: false };
  } catch (err) {
    console.error("E-kalvi search error:", err.message);
    return { found: false };
  }
}

async function searchGovDoc(subject, year, type, medium) {
  try {
    // govdoc.lk category search
    const categoryUrl = `https://govdoc.lk/category/past-papers/gce-${type === 'al' ? 'advance' : 'ordinary'}-level-exam/`;
    
    const response = await axios.get(categoryUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Find link matching subject and year
    let paperUrl = null;
    let title = '';
    
    $('article a, .entry-title a, h2 a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().toLowerCase();
      
      if (text.includes(subject) && text.includes(year)) {
        paperUrl = href;
        title = $(elem).text();
        return false;
      }
    });

    if (paperUrl) {
      // Visit paper page to get PDF
      const paperResponse = await axios.get(paperUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $paper = cheerio.load(paperResponse.data);
      
      let pdfUrl = null;
      $paper('a').each((i, elem) => {
        const href = $paper(elem).attr('href');
        if (href && href.includes('.pdf')) {
          pdfUrl = href;
          return false;
        }
      });

      if (pdfUrl) {
        return {
          found: true,
          subject: subject,
          year: year,
          type: type,
          medium: medium,
          title: title,
          url: pdfUrl,
          pageUrl: paperUrl,
          filename: `${type.toUpperCase()}_${subject}_${year}_govdoc`
        };
      }
    }

    return { found: false };
  } catch (err) {
    console.error("GovDoc search error:", err.message);
    return { found: false };
  }
}

// ==================== LIST ALL PAPERS BY YEAR ====================
cmd({
  pattern: "allpapers",
  alias: ["yearly", "papers"],
  react: "📅",
  desc: "List all available papers for a specific year",
  category: "education",
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide year and type!*\n\nExample: `.allpapers 2022 al`");

    const args = q.split(' ');
    const year = args[0];
    const type = args[1] || 'al';

    if (!year.match(/^\d{4}$/)) {
      return reply("❌ *Invalid year! Use format: 2022, 2021, etc.*");
    }

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Search pastpapers.wiki for all subjects
    const wikiUrl = `https://pastpapers.wiki/${year}-${type === 'al' ? 'a-l' : 'o-l'}-past-papers/`;
    
    let papersList = [];
    
    try {
      const response = await axios.get(wikiUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      $('article h2 a, .entry-title a').each((i, elem) => {
        const title = $(elem).text();
        const link = $(elem).attr('href');
        if (title && link && title.toLowerCase().includes(year)) {
          papersList.push({
            title: title,
            link: link.startsWith('http') ? link : `https://pastpapers.wiki${link}`
          });
        }
      });
    } catch (e) {
      console.log("All papers fetch error:", e.message);
    }

    if (papersList.length === 0) {
      // Fallback: provide manual links
      return reply(`📅 *GCE ${type.toUpperCase()} Papers - ${year}*

🔗 *Visit these pages to download:*

1️⃣ *pastpapers.wiki*
https://pastpapers.wiki/${type}-level-past-papers/

2️⃣ *e-kalvi.com*
https://e-kalvi.com/${type}-level-past-papers/

3️⃣ *govdoc.lk*
https://govdoc.lk/category/past-papers/gce-${type === 'al' ? 'advance' : 'ordinary'}-level-exam/

4️⃣ *paceinstitute.lk*
https://www.paceinstitute.lk/pace-knowledge-society/past-papers/${type === 'al' ? 'advance' : 'ordinary'}-level.html [^27^][^36^]

💡 *To download specific paper, use:*
\`.paper <subject> ${year} ${type}\``);
    }

    let text = `📅 *GCE ${type.toUpperCase()} Papers - ${year}*\n\n`;
    text += `Found ${papersList.length} papers:\n\n`;
    
    papersList.slice(0, 15).forEach((paper, index) => {
      text += `${index + 1}. ${paper.title}\n`;
      text += `   🔗 ${paper.link}\n\n`;
    });

    if (papersList.length > 15) {
      text += `...and ${papersList.length - 15} more papers\n`;
    }

    text += `\n> _Use .paper <subject> ${year} ${type} for direct download_`;

    await reply(text);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    reply("❌ *Failed to fetch papers list!*");
  }
});

// ==================== MARKING SCHEME ====================
cmd({
  pattern: "markings",
  alias: ["answers", "ms", "scheme"],
  react: "✅",
  desc: "Download marking schemes",
  category: "education",
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide paper details!*\n\nExample: `.markings maths 2022 al`");

    const args = q.toLowerCase().trim().split(' ');
    const subject = args[0];
    const year = args[1] || '2022';
    const type = args[2] || 'al';

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Marking schemes are usually on same sites with "marking" or "answers" in URL
    const searchUrls = [
      `https://pastpapers.wiki/${type}-level-${subject}-${year}-marking-scheme/`,
      `https://e-kalvi.com/${type}-level-${subject}-${year}-marking-scheme/`,
      `https://govdoc.lk/${type}-level-${subject}-${year}-answers/`
    ];

    let found = false;
    let result = null;

    for (let url of searchUrls) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          validateStatus: () => true
        });

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          let pdfUrl = null;

          $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('.pdf') && (href.includes('marking') || href.includes('answer'))) {
              pdfUrl = href.startsWith('http') ? href : new URL(href, url).href;
              return false;
            }
          });

          if (pdfUrl) {
            found = true;
            result = {
              url: pdfUrl,
              pageUrl: url,
              source: new URL(url).hostname
            };
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (!found) {
      return reply(`❌ *Marking scheme not found online!*

🔍 *Searched:* ${subject} ${year} ${type.toUpperCase()}

💡 *Try:*
• Check \`.paper ${subject} ${year} ${type}\` - some papers include answers
• Visit: https://www.doenets.lk (Department of Examinations) [^34^]
• Buy official marking scheme books from bookshops`);
    }

    await reply(`✅ *Marking Scheme Found!*

📖 Subject: ${subject}
📅 Year: ${year}
🏫 Type: ${type.toUpperCase()}
🌐 Source: ${result.source}

⏳ Downloading...`);

    // Try to download
    try {
      const headResponse = await axios.head(result.url, { timeout: 10000 });
      const sizeMB = headResponse.headers['content-length'] ? 
        (headResponse.headers['content-length'] / 1024 / 1024).toFixed(2) : 'Unknown';

      if (headResponse.headers['content-length'] && headResponse.headers['content-length'] > 45 * 1024 * 1024) {
        await reply(`⚠️ *File too large (${sizeMB} MB)*

📥 *Download manually:*
${result.url}`);
      } else {
        const response = await axios.get(result.url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const fs = require('fs');
        const path = require('path');
        const tempFile = path.join('/tmp', `marking_${Date.now()}.pdf`);
        fs.writeFileSync(tempFile, response.data);

        await bot.sendMessage(from, {
          document: { url: tempFile },
          fileName: `${type.toUpperCase()}_${subject}_${year}_MarkingScheme.pdf`,
          mimetype: "application/pdf",
          caption: `✅ *Marking Scheme*

📖 ${subject} ${year}
🏫 GCE ${type.toUpperCase()}
🌐 ${result.source}

> _Vima-MD Education_`
        }, { quoted: mek });

        fs.unlinkSync(tempFile);
      }

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
      await reply(`⚠️ *Download failed!*

🔗 *Manual download:*
${result.url}`);
    }

  } catch (err) {
    reply("❌ *Failed to search marking scheme!*");
  }
});

// ==================== SUBJECTS LIST ====================
cmd({
  pattern: "subjects",
  alias: ["subjectlist", "paperslist"],
  react: "📖",
  desc: "List all available subjects",
  category: "education",
}, async (bot, mek, m, { reply, from }) => {
  const subjectsList = `📚 *Available Subjects - GCE A/L*

🔬 *Science Stream:*
• combined-maths (maths)
• physics
• chemistry
• biology (bio)
• ict / git
• agriculture (agri)

💼 *Commerce Stream:*
• economics (econ)
• business-studies (bs)
• accounting (acc)

🎨 *Arts Stream:*
• sinhala / tamil / english
• history / geography (geo)
• art / music / dance / drama

🔧 *Technology Stream:*
• engineering-technology (et)
• bio-technology (bt)
• science-technology (st)

---

📚 *GCE O/L Subjects:*
• maths / science / english / sinhala / tamil
• history / geography / ict
• commerce / art / music / drama
• health / home-economics / agriculture

---

💡 *Usage Examples:*
\`.paper maths 2022 al\`
\`.paper physics 2021 ol sinhala\`
\`.markings chemistry 2020 al\`
\`.allpapers 2022 al\`

> _Vima-MD Education Bot_`;

  await reply(subjectsList);
});

// ==================== HELP COMMAND ====================
cmd({
  pattern: "education",
  alias: ["eduhelp", "papershelp"],
  react: "🎓",
  desc: "Education system help",
  category: "education",
}, async (bot, mek, m, { reply, from }) => {
  const helpText = `🎓 *Vima-MD Education System*

📚 *Commands:*

1️⃣ *\`.paper <subject> <year> <al/ol> [medium]\`* - Download past paper
   Example: \`.paper maths 2022 al\`

2️⃣ *\`.allpapers <year> <al/ol>\`* - List all papers for year
   Example: \`.allpapers 2022 al\`

3️⃣ *\`.markings <subject> <year> <al/ol>\`* - Download marking scheme
   Example: \`.markings physics 2022 al\`

4️⃣ *\`.subjects\`* - List all available subjects

5️⃣ *\`.education\`* - Show this help

---

🌐 *Real Sources Used:*
• pastpapers.wiki - Largest collection [^31^]
• e-kalvi.com - Free downloads [^21^]
• govdoc.lk - Government papers [^25^]
• e-thaksalawa.moe.gov.lk - Official (requires login) [^32^]
• paceinstitute.lk - Model papers [^27^]

⚠️ *Note:* Some papers may require manual download due to website restrictions or large file sizes.

> _Powered by Vima-MD Education Bot_`;

  await reply(helpText);
});
