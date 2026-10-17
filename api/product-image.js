export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI image generation is not configured. Add POLLINATIONS_API_KEY in Vercel project environment variables.'
    });
  }

  const prompt = typeof req.query.prompt === 'string' ? req.query.prompt.slice(0, 1800) : '';
  if (!prompt) return res.status(400).json({ error: 'Missing image prompt' });

  const width = Math.min(1024, Math.max(256, Number.parseInt(req.query.width, 10) || 768));
  const height = Math.min(1280, Math.max(256, Number.parseInt(req.query.height, 10) || 960));
  const seed = Number.parseInt(req.query.seed, 10);
  const target = new URL('https://gen.pollinations.ai/image/' + encodeURIComponent(prompt));
  target.searchParams.set('model', 'black-forest-labs/flux.1-schnell');
  target.searchParams.set('width', String(width));
  target.searchParams.set('height', String(height));
  if (Number.isFinite(seed)) target.searchParams.set('seed', String(seed));

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Authorization: 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(90000)
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res.status(upstream.status === 402 ? 402 : 502).json({
        error: upstream.status === 402
          ? 'The image-generation account budget is exhausted. Check your Pollinations balance or key budget.'
          : 'The image provider could not generate this image.',
        providerStatus: upstream.status,
        detail: detail.slice(0, 300)
      });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(502).json({ error: 'Image provider returned a non-image response.' });
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    const bytes = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(bytes);
  } catch (error) {
    return res.status(504).json({ error: 'Image generation timed out. Please retry.' });
  }
}
