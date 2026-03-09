// api/downloads.js
export default async function handler(req, res) {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { action } = req.query;
    // 支持 GET 参数，也支持 POST Body
    const file = req.query.file || (req.body && req.body.file);
    
    // 获取环境变量
    const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!KV_URL || !KV_TOKEN) {
        console.error("Missing Database Environment Variables!");
        return res.status(500).json({ error: "Database not configured." });
    }

    try {
        if (action === 'increment') {
            if (!file) return res.status(400).json({ error: "Missing file parameter" });
            
            // 发送给 Upstash 数据库
            const response = await fetch(KV_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["HINCRBY", "downloads", file, 1])
            });
            
            if (!response.ok) {
                const errText = await response.text();
                console.error("Upstash Increment Error:", errText);
                return res.status(response.status).json({ error: errText });
            }
            
            const data = await response.json();
            return res.status(200).json({ count: data.result });
            
        } else if (action === 'get_all') {
            const response = await fetch(KV_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["HGETALL", "downloads"])
            });
            
            if (!response.ok) {
                const errText = await response.text();
                console.error("Upstash GetAll Error:", errText);
                return res.status(response.status).json({ error: errText });
            }
            
            const data = await response.json();
            let counts = {};
            
            // 兼容 Upstash 的不同返回格式 (Array 或 Object)
            if (data.result) {
                if (Array.isArray(data.result)) {
                    for (let i = 0; i < data.result.length; i += 2) {
                        counts[data.result[i]] = parseInt(data.result[i+1], 10);
                    }
                } else if (typeof data.result === 'object') {
                    for (const [key, val] of Object.entries(data.result)) {
                        counts[key] = parseInt(val, 10);
                    }
                }
            }
            return res.status(200).json(counts);
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }
    } catch (error) {
        console.error("Serverless API Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
