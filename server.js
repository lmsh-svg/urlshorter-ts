const express = require('express');
const kv = require('@vercel/kv'); // Note: For HF, we'll mock KV or use an alternative
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Mock KV for HF (simple file-based storage; not production-ready, but minimal)
const dbFile = '/tmp/shortener-db.json';
let db = {};
if (fs.existsSync(dbFile)) {
  db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}
async function get(key) { return db[key]; }
async function set(key, value) { db[key] = value; fs.writeFileSync(dbFile, JSON.stringify(db)); }
async function hincrby(key, field, incr) { if (!db[key]) db[key] = {}; db[key][field] += incr; fs.writeFileSync(dbFile, JSON.stringify(db)); }

// Shorten route (from api/shorten.js)
app.post('/api/shorten', async (req, res) => {
  const { longUrl, extension } = req.body;
  if (!longUrl || !extension) return res.status(400).json({ error: 'Missing URL or extension' });
  try { new URL(longUrl); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  let attempts = 0;
  while (attempts < 10) {
    const shortCode = nanoid(6);
    const alias = shortCode + extension;
    if (!await get(alias)) {
      await set(alias, { target: longUrl, visit_count: 0 });
      const shortUrl = `${req.protocol}://${req.headers.host}/${alias}`;
      return res.json({ shortUrl });
    }
    attempts++;
  }
  res.status(500).json({ error: 'Failed to generate unique short URL' });
});

// Redirect route (from api/redirect/[alias].js)
app.get('/:alias*', async (req, res) => {
  const alias = req.params.alias + (req.params[0] || '');
  const data = await get(alias);
  if (!data) return res.status(404).send(`/${alias} not found`);
  await hincrby(alias, 'visit_count', 1);
  res.redirect(302, data.target);
});

app.listen(7860, () => console.log('Server running on port 7860'));