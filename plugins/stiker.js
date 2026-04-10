const { cmd } = require("../command");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

cmd(
  {
    pattern: "sticker",
    alias: ["s", "st"],
    react: "🎯",
    category: "ai",
    filename: __filename,
  },
  async (conn, mek, m, { from, quoted, reply }) => {
    try {

      const msg = quoted || m;

      const mime =
        msg.message?.imageMessage
          ? "image"
          : msg.message?.videoMessage
          ? "video"
          : null;

      if (!mime) {
        return reply("❌ Reply to image or video!");
      }

      reply("🎯 Creating sticker...");

      const input = await conn.downloadAndSaveMediaMessage(msg);

      const output = path.join(__dirname, "../" + Date.now() + ".webp");

      //================ IMAGE ==================
      if (mime === "image") {

        exec(
          `ffmpeg -i ${input} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -vcodec libwebp -quality 80 -lossless 1 -y ${output}`,
          async (err) => {

            if (err) {
              console.log(err);
              return reply("❌ Sticker failed (image)");
            }

            const sticker = fs.readFileSync(output);

            await conn.sendMessage(from, {
              sticker: sticker,
            }, { quoted: mek });

            fs.unlinkSync(input);
            fs.unlinkSync(output);
          }
        );
      }

      //================ VIDEO ==================
      if (mime === "video") {

        exec(
          `ffmpeg -i ${input} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -t 6 -vcodec libwebp -lossless 1 -y ${output}`,
          async (err) => {

            if (err) {
              console.log(err);
              return reply("❌ Sticker failed (video)");
            }

            const sticker = fs.readFileSync(output);

            await conn.sendMessage(from, {
              sticker: sticker,
            }, { quoted: mek });

            fs.unlinkSync(input);
            fs.unlinkSync(output);
          }
        );
      }

    } catch (e) {
      console.log(e);
      reply("❌ Error in sticker command");
    }
  }
);
