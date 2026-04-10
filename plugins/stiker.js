const { cmd } = require("../command");
const fs = require("fs");
const { exec } = require("child_process");

cmd(
  {
    pattern: "sticker",
    alias: ["s", "st"],
    react: "🎯",
    desc: "Convert image/video to sticker",
    category: "convert",
    filename: __filename,
  },
  async (conn, mek, m, { from, quoted, reply }) => {
    try {

      //================== CHECK MEDIA ==================
      const msg = quoted || m;

      if (!msg.message?.imageMessage && !msg.message?.videoMessage) {
        return reply("❌ Please reply to an image or video!");
      }

      reply("🎯 Creating sticker... Please wait");

      //================== DOWNLOAD MEDIA ==================
      const media = await conn.downloadAndSaveMediaMessage(msg);

      const output = "./sticker.webp";

      //================== CONVERT TO WEBP ==================
      if (msg.message.imageMessage) {

        await exec(
          `ffmpeg -i ${media} -vf "scale=512:512:force_original_aspect_ratio=decrease" ${output}`,
          async (err) => {
            if (err) return reply("❌ Failed to create sticker");

            await conn.sendMessage(from, {
              sticker: fs.readFileSync(output),
            }, { quoted: mek });

            fs.unlinkSync(media);
            fs.unlinkSync(output);
          }
        );

      } else if (msg.message.videoMessage) {

        await exec(
          `ffmpeg -i ${media} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -t 6 ${output}`,
          async (err) => {
            if (err) return reply("❌ Failed to create sticker");

            await conn.sendMessage(from, {
              sticker: fs.readFileSync(output),
            }, { quoted: mek });

            fs.unlinkSync(media);
            fs.unlinkSync(output);
          }
        );
      }

    } catch (e) {
      console.log(e);
      reply("❌ Error while creating sticker");
    }
  }
);
