import OpenAI from 'openai';

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada. Revisa el archivo .env');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const STYLE_DESCRIPTIONS = {
  engaging: 'persuasivo y directo, que genere curiosidad y urgencia de compra',
  informative: 'informativo y educativo, destacando características técnicas y specs',
  casual: 'casual y amigable, como si lo recomendara un amigo de confianza',
  viral: 'viral y con gancho fuerte, usando frases impactantes y emojis estratégicos',
};

export async function generateThread({ url, productName, productDescription, config }) {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const { thread_style, language, max_tweets_per_thread } = config;
  const styleDesc = STYLE_DESCRIPTIONS[thread_style] || STYLE_DESCRIPTIONS.engaging;
  const langDesc = language === 'es' ? 'español' : 'inglés';
  const numTweets = parseInt(max_tweets_per_thread) || 5;

  const prompt = `Eres un experto en marketing de afiliados de Amazon y viral content creator en X (Twitter).
Crea un hilo de X/Twitter para promocionar este producto de Amazon afiliado.

URL del producto: ${url}
${productName ? `Nombre del producto: ${productName}` : ''}
${productDescription ? `Descripción adicional: ${productDescription}` : ''}

INSTRUCCIONES:
- Estilo: ${styleDesc}
- Idioma: ${langDesc}
- Número de tweets en el hilo: exactamente ${numTweets}
- Cada tweet MÁXIMO 270 caracteres (deja margen de seguridad)
- Usa emojis estratégicamente para aumentar engagement
- El ÚLTIMO tweet debe incluir el link de afiliado: ${url}
- Los demás tweets NO incluyen el link
- El primer tweet es el HOOK que engancha al lector desde el primer segundo
- Los tweets del medio desarrollan beneficios y características clave
- El último tweet es el call-to-action con el link

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta:
{"tweets": ["texto tweet 1", "texto tweet 2", ..., "texto tweet ${numTweets}"]}

No incluyas markdown, explicaciones ni nada más. Solo el JSON puro.`;

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  let content = response.choices[0].message.content;
  content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  const parsed = JSON.parse(content);

  if (!parsed.tweets || !Array.isArray(parsed.tweets)) {
    throw new Error('Formato de respuesta inválido de OpenAI');
  }

  return parsed.tweets;
}
