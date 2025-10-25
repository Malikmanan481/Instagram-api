import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/igdl", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ error: "Please provide ?url=<Instagram_link>" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const media = await page.evaluate(() => {
      const videos = [...document.querySelectorAll("video")].map(v => v.src);
      const images = [...document.querySelectorAll("article img")].map(i => i.src);
      const caption = document.querySelector("meta[property='og:title']")?.content || "";
      return { videos, images, caption };
    });

    await browser.close();

    if (!media.videos.length && !media.images.length)
      return res.json({ error: "No media found. Possibly private or invalid link." });

    const result = [];
    for (let v of media.videos) result.push({ type: "video", url: v, caption: media.caption });
    for (let i of media.images) result.push({ type: "image", url: i, caption: media.caption });

    res.json({ status: "success", media: result });
  } catch (err) {
    console.error(err);
    res.json({ error: "Failed to fetch Instagram media" });
  }
});

app.listen(PORT, () => console.log(`✅ Instagram Downloader API running on port ${PORT}`));
