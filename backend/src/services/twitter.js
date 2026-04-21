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
