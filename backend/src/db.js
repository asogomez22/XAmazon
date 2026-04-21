import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'bot.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS affiliate_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    product_name TEXT DEFAULT '',
    product_description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    published_at TEXT
  );

  CREATE TABLE IF NOT EXISTS published_tweets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    tweet_ids TEXT NOT NULL DEFAULT '[]',
    thread_content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (link_id) REFERENCES affiliate_links(id)
  );

  CREATE TABLE IF NOT EXISTS bot_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const defaults = [
  ['posting_interval_hours', '4'],
  ['thread_style', 'engaging'],
  ['language', 'es'],
  ['max_tweets_per_thread', '5'],
  ['auto_post', 'true'],
  ['bot_active', 'true'],
];

const insertDefault = db.prepare('INSERT OR IGNORE INTO bot_config (key, value) VALUES (?, ?)');
for (const [key, value] of defaults) {
  insertDefault.run(key, value);
}

export default db;
