import { Router } from 'express';
import db from '../db.js';
import { runBotCycle, getNextPostInfo } from '../services/scheduler.js';
import { verifyCredentials } from '../services/twitter.js';

const router = Router();

const ALLOWED_CONFIG_KEYS = [
  'posting_interval_hours',
  'thread_style',
  'language',
  'max_tweets_per_thread',
  'auto_post',
  'bot_active',
];

router.get('/config', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM bot_config').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/config', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO bot_config (key, value) VALUES (?, ?)');
  const upsertMany = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run(key, String(value));
  });

  const valid = Object.entries(req.body).filter(([k]) => ALLOWED_CONFIG_KEYS.includes(k));
  upsertMany(valid);

  const rows = db.prepare('SELECT key, value FROM bot_config').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.get('/status', (req, res) => {
  const config = Object.fromEntries(
    db.prepare('SELECT key, value FROM bot_config').all().map((r) => [r.key, r.value])
  );

  const stats = {
    total: db.prepare('SELECT COUNT(*) as n FROM affiliate_links').get().n,
    pending: db.prepare("SELECT COUNT(*) as n FROM affiliate_links WHERE status = 'pending'").get().n,
    published: db.prepare("SELECT COUNT(*) as n FROM affiliate_links WHERE status = 'published'").get().n,
    failed: db.prepare("SELECT COUNT(*) as n FROM affiliate_links WHERE status = 'failed'").get().n,
  };

  res.json({
    active: config.bot_active === 'true',
    autoPost: config.auto_post === 'true',
    ...getNextPostInfo(),
    stats,
  });
});

router.post('/trigger', async (req, res) => {
  try {
    const result = await runBotCycle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-twitter', async (req, res) => {
  try {
    const user = await verifyCredentials();
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
