// /api/instagram.js
import { PlaywrightCrawler } from 'crawlee';
import { chromium } from 'playwright-core';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing ?url parameter' });

  try {
    let result = [];

    // Initialize Crawlee with Playwright
    const crawler = new PlaywrightCrawler({
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
      async requestHandler({ page }) {
        await page.goto(url, { waitUntil: 'networkidle' });

        // Extract JSON data from <script type="application/ld+json"> or window._sharedData
        const scriptData = await page.evaluate(() => {
          const ld = document.querySelector('script[type="application/ld+json"]');
          if (ld) {
            try {
              return JSON.parse(ld.innerText);
            } catch (_) {}
          }

          // Fallback: older Instagram pages expose window._sharedData
          const shared = [...document.scripts]
            .map(s => s.textContent)
            .find(t => t.includes('window._sharedData'));
          if (shared) {
            const match = shared.match(/window\._sharedData\s*=\s*(\{.+\});/);
            if (match) return JSON.parse(match[1]);
          }
          return null;
        });

        if (scriptData) {
          // Normalize media links
          if (scriptData.video && scriptData.video.contentUrl) {
            result.push({ type: 'video', url: scriptData.video.contentUrl });
          } else if (scriptData.image) {
            const images = Array.isArray(scriptData.image)
              ? scriptData.image
              : [scriptData.image];
            result.push(...images.map(img => ({ type: 'image', url: img })));
          }
        }
      },
    });

    await crawler.run([url]);

    if (result.length === 0)
      return res.status(404).json({ error: 'No media found. Might be private or restricted.' });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching Instagram media.' });
  }
                                          }
