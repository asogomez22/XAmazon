import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT pt.*, al.url as link_url, al.product_name
       FROM published_tweets pt
       LEFT JOIN affiliate_links al ON pt.link_id = al.id
       ORDER BY pt.created_at DESC`
    )
    .all();

  res.json(
    rows.map((t) => ({
      ...t,
      tweet_ids: JSON.parse(t.tweet_ids),
      thread_content: JSON.parse(t.thread_content),
    }))
  );
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT pt.*, al.url as link_url, al.product_name
       FROM published_tweets pt
       LEFT JOIN affiliate_links al ON pt.link_id = al.id
       WHERE pt.id = ?`
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Tweet no encontrado' });

  res.json({
    ...row,
    tweet_ids: JSON.parse(row.tweet_ids),
    thread_content: JSON.parse(row.thread_content),
  });
});

export default router;
