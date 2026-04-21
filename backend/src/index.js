import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import linksRouter from './routes/links.js';
import tweetsRouter from './routes/tweets.js';
import botRouter from './routes/bot.js';
import { startScheduler } from './services/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/links', linksRouter);
app.use('/api/tweets', tweetsRouter);
app.use('/api/bot', botRouter);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Corriendo en http://localhost:${PORT}`);
  startScheduler();
});
