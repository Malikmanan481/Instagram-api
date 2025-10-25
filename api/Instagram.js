// File: /api/instagram.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url)
    return res.status(400).json({
      error: "Missing Instagram URL parameter (?url=...)",
    });

  try {
    // Helper to fetch safely with timeout
    const safeFetch = async (endpoint) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      try {
        const r = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeout);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      } catch (err) {
        console.error("Fetch failed:", err.message);
        return null;
      }
    };

    // ✅ Priority list of free, working APIs (as of Oct 2025)
    const sources = [
      `https://api.tioxy.tech/api/igdl?url=${encodeURIComponent(url)}`,
      `https://api.betabotz.org/api/download/igdl?url=${encodeURIComponent(url)}&apikey=beta`,
      `https://vihangayt.me/download/instagram?url=${encodeURIComponent(url)}`,
      `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`,
    ];

    let result = null;
    for (const src of sources) {
      console.log("Trying:", src);
      const data = await safeFetch(src);
      if (!data) continue;

      // Normalize results
      const media =
        data.result ||
        data.data ||
        data.media ||
        data.links ||
        data.urls ||
        [];

      if (Array.isArray(media) && media.length > 0) {
        result = media;
        break;
      }
    }

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: "Failed to fetch Instagram media from all available sources.",
      });
    }

    // ✅ Success response
    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Server error while fetching Instagram media.",
    });
  }
}
