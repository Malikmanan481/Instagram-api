import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing Instagram URL parameter (?url=...)" });
  }

  try {
    // ✅ Try Tioxy API first (working October 2025)
    const api1 = `https://api.tioxy.tech/api/igdl?url=${encodeURIComponent(url)}`;
    let response = await fetch(api1);
    let data = await response.json();

    if (data && data.result && data.result.length > 0) {
      return res.status(200).json({ success: true, data: data.result });
    }

    // ✅ Fallback to betabotz (backup API)
    const api2 = `https://api.betabotz.org/api/download/igdl?url=${encodeURIComponent(url)}&apikey=beta`;
    response = await fetch(api2);
    data = await response.json();

    if (data && data.result && data.result.length > 0) {
      return res.status(200).json({ success: true, data: data.result });
    }

    // ❌ If both fail
    return res.status(404).json({ error: "Failed to fetch Instagram media from both sources." });
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ error: "Server error while fetching Instagram media." });
  }
}
