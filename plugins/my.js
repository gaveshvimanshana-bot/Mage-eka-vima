const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

// ==================== PAST PAPER SEARCH ====================
cmd({
  pattern: "pastpaper",
  alias: ["paper", "alpaper", "olpaper", "exam"],
  react: "📚",
  desc: "Download Sri Lankan exam past papers (AL/OL)",
  category: "ai",
  filename: __filename,
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply(`📚 *Past Paper Downloader*

❌ *Please provide search details!*

📌 *Format:* \`.pastpaper <subject> <year> <type>\`

📝 *Examples:*
• \`.pastpaper maths 2022 al\`
• \`.pastpaper physics 2021 ol\`
• \`.pastpaper chemistry 2020 al\`
• \`.pastpaper bio 2019 ol\`

📋 *Subjects:* maths, physics, chemistry, bio, ict, econ, business, accounting, sinhala, english, history, geography

🏫 *Types:* al (Advanced Level) | ol (Ordinary Level)

> _Powered by Vima-MD Education_`);

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    // Parse query
    const args = q.toLowerCase().trim().split(' ');
    const subject = args[0];
    const year = args[1] || '2022';
    const type = args[2] || 'al'; // al or ol

    // Validate
    if (!['al', 'ol'].includes(type)) {
      return reply("❌ *Invalid type! Use 'al' or 'ol'\n\nExample: `.pastpaper maths 2022 al`");
    }

    // Search for paper
    const paperData = await searchPastPaper(subject, year, type);

    if (!paperData.found) {
      // Try alternative sources
      const altResults = await searchAlternativeSources(subject, year, type);
      
      if (altResults.length === 0) {
        return reply(`❌ *Past paper not found!*

🔍 *Searched:* ${subject} ${year} ${type.toUpperCase()}

💡 *Tips:*
• Check spelling of subject
• Try different year (2015-2023)
• Use short names: 'maths' instead of 'mathematics'

📚 *Available on:* 
• www.pastpapers.wiki
• www.e-thaksalawa.moe.gov.lk`);
      }

      // Show alternatives
      let altText = `⚠️ *Exact paper not found, but found alternatives:*\n\n`;
      altResults.forEach((paper, index) => {
        altText += `${index + 1}. ${paper.title}\n`;
        altText += `   📅 Year: ${paper.year}\n`;
        altText += `   🔗 ${paper.url}\n\n`;
      });
      
      return reply(altText + `> _Vima-MD Past Papers_`);
    }

    // Found paper - send info
    await reply(`📚 *Past Paper Found!*

📖 *Subject:* ${paperData.subject}
📅 *Year:* ${paperData.year}
🏫 *Type:* ${paperData.type.toUpperCase()}
📝 *Medium:* ${paperData.medium || 'English/Sinhala/Tamil'}

⏳ *Preparing download...*`);

    // Check file size
    if (paperData.size && paperData.size > 50 * 1024 * 1024) {
      // Too big for WhatsApp
      await bot.sendMessage(from, {
        document: { url: paperData.url },
        fileName: `${paperData.filename}.pdf`,
        mimetype: "application/pdf",
        caption: `📚 ${paperData.title}\n\n⚠️ File too large. Downloading...`
      }, { quoted: mek });
    } else {
      // Send directly
      await bot.sendMessage(from, {
        document: { url: paperData.url },
        fileName: `${paperData.filename}.pdf`,
        mimetype: "application/pdf",
        caption: `📚 *${paperData.title}*

📖 Subject: ${paperData.subject}
📅 Year: ${paperData.year}
🏫 Type: ${paperData.type.toUpperCase()}

> _Downloaded by Vima-MD_`
      }, { quoted: mek });
    }

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Past Paper Error:", err);
    reply("❌ *Failed to download past paper!*\n\nTry again later or check the website directly.");
    await bot.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ==================== SUBJECT LIST ====================
cmd({
  pattern: "subjects",
  alias: ["papers", "syllabus"],
  react: "📖",
  desc: "List available subjects for past papers",
  category: "education",
}, async (bot, mek, m, { reply, from }) => {
  const subjectsList = `📚 *Available Subjects - A/L*

🔬 *Science:*
• physics, chemistry, biology, maths, applied-maths, agri, ict

💼 *Commerce:*
• accounting, business, econ, ict

🎨 *Arts:*
• sinhala, english, tamil, history, geography, civics, art, dance, music, drama

📚 *Technology:*
• eng-tech, bio-tech, info-tech, science-tech

---

📚 *Available Subjects - O/L*

🔬 *Core:*
• maths, science, english, sinhala, tamil, religion, history

📝 *Optional:*
• geography, commerce, art, music, dance, drama, ict, agri, home-econ, health

---

💡 *Usage:* \`.pastpaper <subject> <year> <al/ol>\`

> _Vima-MD Education_`;

  await reply(subjectsList);
});

// ==================== PAPER BY YEAR ====================
cmd({
  pattern: "papers",
  alias: ["yearpapers", "allpapers"],
  react: "📅",
  desc: "Get all papers for a specific year",
  category: "education",
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide year and type!*\n\nExample: `.papers 2022 al`");

    const args = q.split(' ');
    const year = args[0];
    const type = args[1] || 'al';

    if (!year.match(/^\d{4}$/)) {
      return reply("❌ *Invalid year! Use format: 2022, 2021, etc.*");
    }

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    const papers = await getPapersByYear(year, type);

    if (papers.length === 0) {
      return reply(`❌ *No papers found for ${year} ${type.toUpperCase()}*`);
    }

    let text = `📅 *Past Papers - ${year} ${type.toUpperCase()}*\n\n`;
    text += `Found ${papers.length} papers:\n\n`;

    papers.slice(0, 10).forEach((paper, index) => {
      text += `${index + 1}. ${paper.subject}\n`;
      text += `   📄 ${paper.title}\n`;
      text += `   🔗 ${paper.url}\n\n`;
    });

    if (papers.length > 10) {
      text += `...and ${papers.length - 10} more papers\n`;
    }

    text += `\n> _Use .pastpaper <subject> ${year} ${type} to download_`;

    await reply(text);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    reply("❌ *Failed to fetch papers!*");
  }
});

// ==================== MARKING SCHEME ====================
cmd({
  pattern: "marking",
  alias: ["answers", "scheme", "ms"],
  react: "✅",
  desc: "Download marking scheme for past paper",
  category: "education",
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide paper details!*\n\nExample: `.marking maths 2022 al`");

    const args = q.toLowerCase().trim().split(' ');
    const subject = args[0];
    const year = args[1] || '2022';
    const type = args[2] || 'al';

    await bot.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    const markingScheme = await searchMarkingScheme(subject, year, type);

    if (!markingScheme.found) {
      return reply(`❌ *Marking scheme not found!*

🔍 Searched: ${subject} ${year} ${type.toUpperCase()}

💡 *Tips:*
• Try different year
• Some papers don't have published marking schemes
• Check www.moe.gov.lk directly`);
    }

    await bot.sendMessage(from, {
      document: { url: markingScheme.url },
      fileName: `${markingScheme.filename}.pdf`,
      mimetype: "application/pdf",
      caption: `✅ *Marking Scheme*

📖 ${markingScheme.title}
📅 Year: ${markingScheme.year}
🏫 Type: ${markingScheme.type.toUpperCase()}

> _Vima-MD Education_`
    }, { quoted: mek });

    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    reply("❌ *Failed to download marking scheme!*");
  }
});

// ==================== MODEL PAPERS ====================
cmd({
  pattern: "model",
  alias: ["modelpaper", "mock"],
  react: "📝",
  desc: "Get model papers for subjects",
  category: "education",
}, async (bot, mek, m, { q, reply, from }) => {
  try {
    if (!q) return reply("❌ *Provide subject!*\n\nExample: `.model maths al`");

    const args = q.split(' ');
    const subject = args[0];
    const type = args[1] || 'al';

    await bot.sendMessage(from, { react: { text: "📝", key: mek.key } });

    const models = await getModelPapers(subject, type);

    if (models.length === 0) {
      return reply(`❌ *No model papers found for ${subject}*`);
    }

    let text = `📝 *Model Papers - ${subject.toUpperCase()} ${type.toUpperCase()}*\n\n`;

    models.slice(0, 5).forEach((paper, index) => {
      text += `${index + 1}. ${paper.title}\n`;
      text += `   📅 ${paper.year || 'N/A'}\n`;
      text += `   🏫 ${paper.institution || 'Unknown'}\n`;
      text += `   🔗 Use: .pastpaper ${subject} ${paper.year || '2023'} ${type}\n\n`;
    });

    await reply(text + `> _Vima-MD Model Papers_`);
    await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    reply("❌ *Failed to fetch model papers!*");
  }
});

// ==================== HELPER FUNCTIONS ====================

async function searchPastPaper(subject, year, type) {
  // This is a mock function - in production, scrape from real sites
  
  const subjectMap = {
    'maths': 'mathematics',
    'math': 'mathematics',
    'physics': 'physics',
    'chemistry': 'chemistry',
    'bio': 'biology',
    'biology': 'biology',
    'ict': 'information-technology',
    'it': 'information-technology',
    'econ': 'economics',
    'economics': 'economics',
    'business': 'business-studies',
    'bs': 'business-studies',
    'accounting': 'accounting',
    'acc': 'accounting',
    'sinhala': 'sinhala',
    'english': 'english',
    'tamil': 'tamil',
    'history': 'history',
    'geography': 'geography',
    'geo': 'geography',
    'agri': 'agriculture',
    'agriculture': 'agriculture',
    'dt': 'design-technology',
    'et': 'engineering-technology',
    'bt': 'bio-technology'
  };

  const fullSubject = subjectMap[subject] || subject;
  
  // Mock database of papers
  const mockPapers = {
    'mathematics': {
      '2022': {
        'al': {
          found: true,
          subject: 'Mathematics',
          year: '2022',
          type: 'al',
          medium: 'English/Sinhala',
          title: 'GCE A/L Mathematics 2022',
          filename: 'AL_Maths_2022',
          url: 'https://www.pastpapers.wiki/download/a-level-mathematics-2022/',
          size: 2500000
        }
      }
    },
    'physics': {
      '2022': {
        'al': {
          found: true,
          subject: 'Physics',
          year: '2022',
          type: 'al',
          medium: 'English',
          title: 'GCE A/L Physics 2022',
          filename: 'AL_Physics_2022',
          url: 'https://www.pastpapers.wiki/download/a-level-physics-2022/',
          size: 3200000
        }
      }
    },
    'chemistry': {
      '2022': {
        'al': {
          found: true,
          subject: 'Chemistry',
          year: '2022',
          type: 'al',
          medium: 'English/Sinhala',
          title: 'GCE A/L Chemistry 2022',
          filename: 'AL_Chemistry_2022',
          url: 'https://www.pastpapers.wiki/download/a-level-chemistry-2022/',
          size: 2800000
        }
      }
    },
    'biology': {
      '2022': {
        'al': {
          found: true,
          subject: 'Biology',
          year: '2022',
          type: 'al',
          medium: 'English',
          title: 'GCE A/L Biology 2022',
          filename: 'AL_Bio_2022',
          url: 'https://www.pastpapers.wiki/download/a-level-biology-2022/',
          size: 4500000
        }
      }
    }
  };

  // Check if we have this paper in mock DB
  if (mockPapers[fullSubject] && mockPapers[fullSubject][year] && mockPapers[fullSubject][year][type]) {
    return mockPapers[fullSubject][year][type];
  }

  // Try to scrape from real sources
  return await scrapeRealPaper(fullSubject, year, type);
}

async function scrapeRealPaper(subject, year, type) {
  try {
    // Try pastpapers.wiki
    const wikiUrl = `https://www.pastpapers.wiki/${type}-level-${subject}-${year}-past-paper/`;
    const response = await axios.get(wikiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }).catch(() => null);

    if (response && response.status === 200) {
      const $ = cheerio.load(response.data);
      const pdfLink = $('a[href$=".pdf"]').first().attr('href');
      
      if (pdfLink) {
        return {
          found: true,
          subject: subject,
          year: year,
          type: type,
          title: `GCE ${type.toUpperCase()} ${subject} ${year}`,
          filename: `${type.toUpperCase()}_${subject}_${year}`,
          url: pdfLink.startsWith('http') ? pdfLink : `https://www.pastpapers.wiki${pdfLink}`,
          medium: 'Mixed'
        };
      }
    }

    // Try e-thaksalawa
    const thaksalawaUrl = `https://www.e-thaksalawa.moe.gov.lk/${type}/${subject}/${year}`;
    // ... similar scraping logic

    return { found: false };
  } catch (err) {
    console.error("Scrape Error:", err);
    return { found: false };
  }
}

async function searchAlternativeSources(subject, year, type) {
  const alternatives = [];
  
  // Search nearby years
  for (let y = parseInt(year) - 2; y <= parseInt(year) + 2; y++) {
    if (y.toString() === year) continue;
    const result = await searchPastPaper(subject, y.toString(), type);
    if (result.found) {
      alternatives.push(result);
    }
  }
  
  return alternatives;
}

async function searchMarkingScheme(subject, year, type) {
  // Similar to searchPastPaper but for marking schemes
  const markingData = {
    found: true,
    subject: subject,
    year: year,
    type: type,
    title: `GCE ${type.toUpperCase()} ${subject} ${year} - Marking Scheme`,
    filename: `${type.toUpperCase()}_${subject}_${year}_MS`,
    url: `https://www.pastpapers.wiki/marking-scheme-${type}-level-${subject}-${year}/`
  };
  
  return markingData;
}

async function getPapersByYear(year, type) {
  const papers = [];
  const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'ict', 'economics', 'business-studies', 'accounting'];
  
  for (let subject of subjects) {
    const result = await searchPastPaper(subject, year, type);
    if (result.found) {
      papers.push(result);
    }
  }
  
  return papers;
}

async function getModelPapers(subject, type) {
  // Return mock model papers
  return [
    { title: `${subject} Model Paper 1`, institution: 'Royal College', year: '2023' },
    { title: `${subject} Model Paper 2`, institution: 'Ananda College', year: '2023' },
    { title: `${subject} Model Paper 3`, institution: 'Visakha Vidyalaya', year: '2022' }
  ];
                }
