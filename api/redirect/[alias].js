export default async (req, res) => {
       const { Redis } = await import('@upstash/redis');

       const redisUrl = process.env.KV_REDIS_URL;
       const redisToken = process.env.KV_REDIS_TOKEN || '';

       if (!redisUrl) {
         console.error('KV_REDIS_URL is missing');
         return res.status(500).send('Redis configuration error: Missing URL');
       }

       const redis = new Redis({
         url: redisUrl,
         token: redisToken
       });

       const alias = req.url.replace('/api/redirect/', '');

       if (!alias) {
         return res.status(400).send('Missing alias');
       }

       const data = await redis.get(alias);

       if (!data) {
         return res.status(404).send(`/${alias} not found`);
       }

       const parsedData = JSON.parse(data);

       await redis.incrby(`${alias}:visit_count`, 1);

       res.redirect(302, parsedData.target);
     };
