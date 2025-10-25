import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided." });

  try {
    const api = `https://malik-x-instagram-api.vercel.app/api/igdl?url=${encodeURIComponent(url)}`;
    const response = await fetch(api);
    const data = await response.json();

    if (!data || !data.result || data.result.length === 0) {
      return res.status(404).json({ error: "Failed to fetch Instagram media." });
    }

    return res.status(200).json({ success: true, data: data.result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error while fetching Instagram media." });
  }
}
