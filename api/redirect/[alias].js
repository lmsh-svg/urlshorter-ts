export default async (req, res) => {
       const { Redis } = await import('@upstash/redis');

       const redis = new Redis({
         url: process.env.KV_REDIS_URL,
         token: process.env.KV_REDIS_TOKEN || '' // Token may not be needed for some setups
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
