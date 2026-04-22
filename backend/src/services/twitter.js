import { TwitterApi } from 'twitter-api-v2';

function getClient() {
  const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } = process.env;

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    throw new Error('Credenciales de Twitter/X no configuradas. Revisa el archivo .env');
  }

  return new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  });
}

function getErrorStatusCode(error) {
  const candidates = [
    error?.code,
    error?.status,
    error?.statusCode,
    error?.response?.status,
    error?.response?.statusCode,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function getErrorDetail(error) {
  if (Array.isArray(error?.data?.errors) && error.data.errors.length > 0) {
    return error.data.errors
      .map((item) => item?.message || item?.detail || item?.title)
      .filter(Boolean)
      .join(' | ');
  }

  return (
    error?.data?.detail ||
    error?.data?.title ||
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.message ||
    'Error desconocido al publicar en X'
  );
}

export function isTwitterPaymentRequiredError(error) {
  return getErrorStatusCode(error) === 402;
}

export function getTwitterPublishErrorMessage(error) {
  const statusCode = getErrorStatusCode(error);
  const detail = getErrorDetail(error);

  if (statusCode === 402) {
    return `X/Twitter ha rechazado la publicacion con codigo 402. Tu plan o acceso API no permite publicar tweets con estas credenciales. ${detail}`.trim();
  }

  if (statusCode) {
    return `X/Twitter ha rechazado la publicacion con codigo ${statusCode}. ${detail}`.trim();
  }

  return detail;
}

export async function postThread(tweets) {
  const client = getClient();
  const rwClient = client.readWrite;

  let lastTweetId = null;
  const tweetIds = [];

  for (const text of tweets) {
    const params = { text };
    if (lastTweetId) {
      params.reply = { in_reply_to_tweet_id: lastTweetId };
    }
    const { data } = await rwClient.v2.tweet(params);
    lastTweetId = data.id;
    tweetIds.push(data.id);
  }

  return tweetIds;
}

export async function verifyCredentials() {
  const client = getClient();
  const { data } = await client.v2.me();
  return data;
}
