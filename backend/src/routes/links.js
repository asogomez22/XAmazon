import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  const links = status
    ? db.prepare('SELECT * FROM affiliate_links WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM affiliate_links ORDER BY created_at DESC').all();
  res.json(links);
});

router.post('/', (req, res) => {
  const { url, product_name = '', product_description = '' } = req.body;

  if (!url?.trim()) {
    return res.status(400).json({ error: 'La URL es requerida' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL no válida' });
  }

  const result = db
    .prepare('INSERT INTO affiliate_links (url, product_name, product_description) VALUES (?, ?, ?)')
    .run(url.trim(), product_name.trim(), product_description.trim());

  const link = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(link);
});

router.delete('/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link no encontrado' });

  db.prepare('DELETE FROM affiliate_links WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.patch('/:id/retry', (req, res) => {
  const link = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link no encontrado' });

  db.prepare("UPDATE affiliate_links SET status = 'pending', published_at = NULL WHERE id = ?").run(
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM affiliate_links WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
