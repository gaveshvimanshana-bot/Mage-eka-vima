const { cmd } = require("../command");

cmd({
pattern: "img",
desc: "Generate AI Image",
category: "ai",
react: "🖼️",
filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
try {
if (!q) return reply("❌ Prompt ekak denna!\nEx: .img anime girl");

// Free image generator (pollinations)  
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}`;  

await conn.sendMessage(from, {  
  image: { url: url },  
  caption: `🖼️ AI Image\n📝 Prompt: ${q}`  
}, { quoted: mek });

} catch (e) {
console.log(e);
reply("❌ Error generating image!");
}
});

Oke advance karna barida freee bn
