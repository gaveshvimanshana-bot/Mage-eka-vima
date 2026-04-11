const { cmd } = require("../command");
const https = require("https");

cmd({
  pattern: "pa",
  desc: "Download Past Papers (Grade System)",
  category: "ai",
  react: "📄",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

  // 🔥 Grade + Subject system
  const papers = {
    "10science": "https://drive.google.com/uc?export=download&id=1g0CELfSKuKAp9lXGSrCACKs5BJcSUvgA&confirm=t",
    "10maths": "YOUR_LINK_HERE",
    "10ict": "YOUR_LINK_HERE",

    "11science": "YOUR_LINK_HERE",
    "11maths": "YOUR_LINK_HERE",
    "11ict": "YOUR_LINK_HERE",

    "olscience": "YOUR_LINK_HERE",
    "olmaths": "YOUR_LINK_HERE"
  };

  let grade = args[0];
  let subject = args[1];

  if (!grade || !subject) {
    return reply(`📚 Use like:

.pa 10 science
.pa 11 maths
.pa ol science`);
  }

  let key = (grade + subject).toLowerCase();

  if (!papers[key]) {
    return reply("❌ Not found!\nTry: 10 science / 11 maths / ol science");
  }

  try {

    await reply("⏳ Downloading paper...");

    https.get(papers[key], (res) => {

      let data = [];

      res.on("data", (chunk) => data.push(chunk));

      res.on("end", async () => {

        const buffer = Buffer.concat(data);

        await conn.sendMessage(from, {
          document: buffer,
          mimetype: "application/pdf",
          fileName: `${grade}_${subject}.pdf`,
          caption: `📚 ${grade.toUpperCase()} ${subject.toUpperCase()} Past Paper`
        }, { quoted: mek });

      });

    }).on("error", (err) => {
      console.log(err);
      reply("❌ Download error!");
    });

  } catch (e) {
    console.log(e);
    reply("❌ Failed!");
  }

});
