import cron from 'node-cron';
import db from '../db.js';
import { generateThread } from './openai.js';
import {
  getTwitterPublishErrorMessage,
  isTwitterPaymentRequiredError,
  postThread,
} from './twitter.js';

let job = null;

function saveGeneratedThread(linkId, tweetIds, tweets) {
  db.prepare(
    'INSERT INTO published_tweets (link_id, tweet_ids, thread_content) VALUES (?, ?, ?)'
  ).run(linkId, JSON.stringify(tweetIds), JSON.stringify(tweets));
}

function markLinkStatus(linkId, status) {
  db.prepare("UPDATE affiliate_links SET status = ?, published_at = datetime('now') WHERE id = ?").run(
    status,
    linkId
  );
}

export function startScheduler() {
  if (job) job.stop();

  // Check every 5 minutes
  job = cron.schedule('*/5 * * * *', async () => {
    try {
      await runBotCycle();
    } catch (err) {
      console.error('[Scheduler] Error no controlado:', err.message);
    }
  });

  console.log('[Scheduler] Iniciado - revisando cada 5 minutos');
}

export async function runBotCycle() {
  const config = getConfig();

  if (config.bot_active !== 'true') {
    console.log('[Bot] Inactivo - saltando ciclo');
    return { status: 'inactive', message: 'Bot está desactivado' };
  }

  const intervalHours = parseFloat(config.posting_interval_hours || '4');

  // Check how long since last post
  const lastTweet = db
    .prepare('SELECT created_at FROM published_tweets ORDER BY created_at DESC LIMIT 1')
    .get();

  if (lastTweet) {
    const lastTime = new Date(lastTweet.created_at + 'Z');
    const now = new Date();
    const hoursSinceLast = (now - lastTime) / (1000 * 60 * 60);

    if (hoursSinceLast < intervalHours) {
      const nextIn = Math.round((intervalHours - hoursSinceLast) * 60);
      console.log(`[Bot] Próxima publicación en ${nextIn} minutos`);
      return { status: 'waiting', message: `Próxima publicación en ${nextIn} minutos` };
    }
  }

  // Pick the oldest pending link
  const link = db
    .prepare("SELECT * FROM affiliate_links WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1")
    .get();

  if (!link) {
    console.log('[Bot] No hay links pendientes');
    return { status: 'no_links', message: 'No hay links pendientes para publicar' };
  }

  console.log(`[Bot] Procesando: ${link.url}`);

  try {
    const tweets = await generateThread({
      url: link.url,
      productName: link.product_name,
      productDescription: link.product_description,
      config,
    });

    let tweetIds = [];
    let resultStatus = 'draft';
    let resultMessage = `Hilo guardado como draft con ${tweets.length} tweets`;

    if (config.auto_post === 'true') {
      try {
        tweetIds = await postThread(tweets);
        console.log(`[Bot] Hilo publicado con ${tweetIds.length} tweets`);
        resultStatus = 'posted';
        resultMessage = `Hilo publicado con ${tweetIds.length} tweets`;
      } catch (error) {
        if (!isTwitterPaymentRequiredError(error)) {
          throw error;
        }

        const publishError = getTwitterPublishErrorMessage(error);
        console.warn(`[Bot] ${publishError}`);
        resultMessage = `Hilo generado y guardado como draft. ${publishError}`;
      }
    } else {
      console.log('[Bot] Auto-post desactivado - guardado como draft');
    }

    saveGeneratedThread(link.id, tweetIds, tweets);
    markLinkStatus(link.id, resultStatus === 'posted' ? 'published' : 'draft');

    return {
      status: resultStatus,
      message: resultMessage,
      tweets,
      tweetIds,
    };
  } catch (error) {
    console.error('[Bot] Error:', error.message);
    db.prepare("UPDATE affiliate_links SET status = 'failed' WHERE id = ?").run(link.id);
    throw error;
  }
}

export function getNextPostInfo() {
  const config = getConfig();
  const intervalHours = parseFloat(config.posting_interval_hours || '4');

  const lastTweet = db
    .prepare('SELECT created_at FROM published_tweets ORDER BY created_at DESC LIMIT 1')
    .get();

  if (!lastTweet) {
    return { canPostNow: true, nextPostAt: null, minutesRemaining: 0, lastPostedAt: null };
  }

  const lastTime = new Date(lastTweet.created_at + 'Z');
  const nextPostAt = new Date(lastTime.getTime() + intervalHours * 60 * 60 * 1000);
  const now = new Date();
  const minutesRemaining = Math.max(0, Math.round((nextPostAt - now) / (1000 * 60)));

  return {
    canPostNow: minutesRemaining === 0,
    nextPostAt: nextPostAt.toISOString(),
    minutesRemaining,
    lastPostedAt: lastTweet.created_at,
  };
}

function getConfig() {
  const rows = db.prepare('SELECT key, value FROM bot_config').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
