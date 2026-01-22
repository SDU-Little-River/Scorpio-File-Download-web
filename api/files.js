export default async function handler(req, res) {
    const OWNER = 'DuskScorpio';
    const REPO = 'Scorpio-File-Downloads';
    const BRANCH = 'main';

    try {
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Vercel-Serverless-Function'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API responded with ${response.status}`);
        }

        const data = await response.json();

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}