const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "paper",
  desc: "Search past papers",
  category: "ai",
  filename: __filename
},
async (conn, mek, m, { from, args }) => {

  if (!args[0]) return await conn.sendMessage(from, { text: "❌ Give a search term\nExample: .paper maths" }, { quoted: mek });

  const query = args.join(" ");

  try {
    const res = await axios.get("https://chama-api-hub.vercel.app/api/academic/search", {
      params: {
        apikey: "https://chama-api-hub.vercel.app/api/academic/search?apikey=chama_a378377a400afa5e660c440891f73d18&q=Maths",
        q: query
      }
    });

    const data = res.data;

    if (!data.status || data.result.length === 0) {
      return await conn.sendMessage(from, { text: "❌ No results found" }, { quoted: mek });
    }

    let txt = `📚 *Past Papers Results*\n\n`;

    data.result.slice(0, 5).forEach((item, i) => {
      txt += `${i + 1}️⃣ ${item.title}\n🔗 ${item.url}\n\n`;
    });

    txt += `📊 Total Results: ${data.count}`;

    await conn.sendMessage(from, { text: txt }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Error fetching data" }, { quoted: mek });
  }

});
