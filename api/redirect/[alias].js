const kv = require('@vercel/kv');

module.exports = async (req, res) => {
  // Extract alias from the original path (after rewrite)
  const alias = req.url.replace('/api/redirect/', '');

  if (!alias) {
    return res.status(400).send('Missing alias');
  }

  const data = await kv.get(alias);

  if (!data) {
    return res.status(404).send(`/${alias} not found`);
  }

  // Increment visit count
  await kv.hincrby(alias, 'visit_count', 1);

  // Redirect to target
  res.redirect(302, data.target);
};