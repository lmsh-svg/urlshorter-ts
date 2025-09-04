export default async (req, res) => {
       const { Redis } = await import('@upstash/redis');
       const { nanoid } = await import('nanoid');

       const redisUrl = process.env.KV_REDIS_URL;
       const redisToken = process.env.KV_REDIS_TOKEN || '';

       if (!redisUrl) {
         console.error('KV_REDIS_URL is missing');
         return res.status(500).json({ error: 'Redis configuration error: Missing URL' });
       }

       const redis = new Redis({
         url: redisUrl,
         token: redisToken
       });

       if (req.method !== 'POST') {
         return res.status(405).json({ error: 'Method not allowed' });
       }

       const { longUrl, extension } = req.body;

       if (!longUrl || !extension) {
         return res.status(400).json({ error: 'Missing URL or extension' });
       }

       try {
         new URL(longUrl);
       } catch {
         return res.status(400).json({ error: 'Invalid URL' });
       }

       let attempts = 0;
       const shortLength = 6;

       while (attempts < 10) {
         const shortCode = nanoid(shortLength);
         const alias = shortCode + extension;

         const existing = await redis.get(alias);
         if (!existing) {
           await redis.set(alias, JSON.stringify({ target: longUrl, visit_count: 0 }));
           const origin = req.headers['x-forwarded-proto'] + '://' + req.headers.host;
           const shortUrl = `${origin}/${alias}`;
           return res.status(200).json({ shortUrl });
         }

         attempts++;
       }

       res.status(500).json({ error: 'Failed to generate unique short URL' });
     };
