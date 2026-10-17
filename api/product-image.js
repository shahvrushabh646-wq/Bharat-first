// Shopora product-image endpoint backed by Meta Model API (Muse Image).
// Keep META_MODEL_API_KEY server-side in Vercel; never expose it to browser code.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.META_MODEL_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Meta image generation is not configured. Add META_MODEL_API_KEY in the Vercel project environment variables.'
    });
  }

  const prompt = typeof req.query.prompt === 'string' ? req.query.prompt.slice(0, 1800).trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Missing image prompt' });

  const width = Math.min(1536, Math.max(256, Number.parseInt(req.query.width, 10) || 1024));
  const height = Math.min(1536, Math.max(256, Number.parseInt(req.query.height, 10) || 1280));
  const size = width + 'x' + height;

  try {
    const upstream = await fetch('https://api.meta.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'muse-image-1.0',
        prompt,
        n: 1,
        size,
        response_format: 'b64_json',
        output_format: 'webp'
      }),
      signal: AbortSignal.timeout(90000)
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: upstream.status === 401 || upstream.status === 403
          ? 'Meta Model API rejected the key. Check META_MODEL_API_KEY and its access.'
          : upstream.status === 429
            ? 'Meta image generation rate limit reached. Please retry later.'
            : 'Meta image generation failed.',
        providerStatus: upstream.status,
        detail: detail.slice(0, 300)
      });
    }

    const payload = await upstream.json();
    const image = payload?.data?.[0];
    let bytes;
    let contentType = 'image/webp';

    if (typeof image?.b64_json === 'string' && image.b64_json) {
      bytes = Buffer.from(image.b64_json, 'base64');
      if (image.output_format === 'png') contentType = 'image/png';
      else if (image.output_format === 'jpeg') contentType = 'image/jpeg';
    } else if (typeof image?.url === 'string' && image.url) {
      const imageResponse = await fetch(image.url, { signal: AbortSignal.timeout(30000) });
      if (!imageResponse.ok) {
        return res.status(502).json({ error: 'Meta returned an image URL that could not be downloaded.' });
      }
      contentType = imageResponse.headers.get('content-type') || contentType;
      if (!contentType.startsWith('image/')) {
        return res.status(502).json({ error: 'Meta returned a non-image response.' });
      }
      bytes = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      return res.status(502).json({ error: 'Meta returned no image data.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(bytes);
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      error: timeout ? 'Meta image generation timed out. Please retry.' : 'Could not reach Meta image generation.'
    });
  }
}
