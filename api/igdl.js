import puppeteer from "puppeteer";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing Instagram URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const videos = [...document.querySelectorAll("video")].map(v => v.src);
      const images = [...document.querySelectorAll("article img")].map(i => i.src);
      const caption = document.querySelector("meta[property='og:title']")?.content || "";
      return { videos, images, caption };
    });

    await browser.close();

    if (!data.videos.length && !data.images.length)
      return res.json({ error: "No media found. Possibly private or invalid link." });

    const result = [];
    for (let v of data.videos) result.push({ type: "video", url: v, caption: data.caption });
    for (let i of data.images) result.push({ type: "image", url: i, caption: data.caption });

    res.status(200).json({ status: "success", media: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Instagram media." });
  }
}
