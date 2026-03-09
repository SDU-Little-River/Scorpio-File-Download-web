// api/downloads.js
export default async function handler(req, res) {
    const { file, action } = req.query;
    
    // Automatically retrieve the Upstash environment variables injected by Vercel Marketplace
    const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        return res.status(500).json({ error: "Redis database is not configured. Please add 'Upstash for Redis' from the Vercel Marketplace." });
    }

    try {
        if (action === 'increment') {
            if (!file) return res.status(400).json({ error: "File name must be provided" });
            
            // Execute Redis command: Increment the download count for the specified file by 1
            const response = await fetch(KV_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["HINCRBY", "downloads", file, 1])
            });
            const data = await response.json();
            return res.status(200).json({ count: data.result });
            
        } else if (action === 'get_all') {
            // Get the download counts for all files
            const response = await fetch(KV_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["HGETALL", "downloads"])
            });
            const data = await response.json();
            
            // Convert the array format returned by Redis into an object format {"Files/a.zip": 10}
            const counts = {};
            if (data.result && Array.isArray(data.result)) {
                for (let i = 0; i < data.result.length; i += 2) {
                    counts[data.result[i]] = parseInt(data.result[i+1], 10);
                }
            }
            return res.status(200).json(counts);
        } else {
            return res.status(400).json({ error: "Unknown action" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
