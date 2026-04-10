const { cmd } = require("../command");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

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

      const msg = quoted ? quoted : m;

      const type =
        msg.message?.imageMessage
          ? "image"
          : msg.message?.videoMessage
          ? "video"
          : null;

      if (!type) {
        return reply("❌ Please reply to an image or video!");
      }

      reply("🎯 Creating sticker... Please wait");

      const mediaPath = await conn.downloadAndSaveMediaMessage(msg);

      const outputPath = path.join(__dirname, "../temp_" + Date.now() + ".webp");

      //================ IMAGE ==================
      if (type === "image") {

        exec(
          `ffmpeg -i ${mediaPath} -vf "scale=512:512:force_original_aspect_ratio=decrease" -y ${outputPath}`,
          async (err) => {

            if (err) {
              console.log(err);
              return reply("❌ Failed to create sticker");
            }

            await conn.sendMessage(from, {
              sticker: fs.readFileSync(outputPath),
            }, { quoted: mek });

            fs.unlinkSync(mediaPath);
            fs.unlinkSync(outputPath);
          }
        );
      }

      //================ VIDEO ==================
      if (type === "video") {

        exec(
          `ffmpeg -i ${mediaPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -t 6 -y ${outputPath}`,
          async (err) => {

            if (err) {
              console.log(err);
              return reply("❌ Failed to create sticker");
            }

            await conn.sendMessage(from, {
              sticker: fs.readFileSync(outputPath),
            }, { quoted: mek });

            fs.unlinkSync(mediaPath);
            fs.unlinkSync(outputPath);
          }
        );
      }

    } catch (e) {
      console.log(e);
      reply("❌ Error while creating sticker");
    }
  }
);
