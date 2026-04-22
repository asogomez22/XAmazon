import { Router } from 'express';
import db from '../db.js';
import { getTwitterPublishErrorMessage, postThread } from '../services/twitter.js';

const router = Router();

function getThreadRow(id) {
  return db
    .prepare(
      `SELECT pt.*, al.url as link_url, al.product_name
       FROM published_tweets pt
       LEFT JOIN affiliate_links al ON pt.link_id = al.id
       WHERE pt.id = ?`
    )
    .get(id);
}

function serializeThread(row) {
  return {
    ...row,
    tweet_ids: JSON.parse(row.tweet_ids),
    thread_content: JSON.parse(row.thread_content),
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT pt.*, al.url as link_url, al.product_name
       FROM published_tweets pt
       LEFT JOIN affiliate_links al ON pt.link_id = al.id
       ORDER BY pt.created_at DESC`
    )
    .all();

  res.json(rows.map(serializeThread));
});

router.get('/:id', (req, res) => {
  const row = getThreadRow(req.params.id);

  if (!row) return res.status(404).json({ error: 'Tweet no encontrado' });

  res.json(serializeThread(row));
});

router.post('/:id/publish', async (req, res) => {
  const row = getThreadRow(req.params.id);

  if (!row) {
    return res.status(404).json({ error: 'Hilo no encontrado' });
  }

  const existingTweetIds = JSON.parse(row.tweet_ids);
  if (existingTweetIds.length > 0) {
    return res.status(400).json({ error: 'Este hilo ya esta publicado en X' });
  }

  const tweets = JSON.parse(row.thread_content);
  if (!Array.isArray(tweets) || tweets.length === 0) {
    return res.status(400).json({ error: 'El draft no tiene tweets para publicar' });
  }

  try {
    const tweetIds = await postThread(tweets);

    db.prepare("UPDATE published_tweets SET tweet_ids = ?, created_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(tweetIds),
      req.params.id
    );

    if (row.link_id) {
      db.prepare("UPDATE affiliate_links SET status = 'published', published_at = datetime('now') WHERE id = ?").run(
        row.link_id
      );
    }

    res.json(serializeThread(getThreadRow(req.params.id)));
  } catch (error) {
    res.status(500).json({ error: getTwitterPublishErrorMessage(error) });
  }
});

export default router;
