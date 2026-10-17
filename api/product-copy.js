// Generate marketplace-style product copy for Shopora using the OpenAI API.
// Keep OPENAI_API_KEY in Vercel environment variables; never expose it to the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Automatic product copy is not configured. Add OPENAI_API_KEY in Vercel environment variables.'
    });
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 180) : '';
  if (!name) return res.status(400).json({ error: 'Product name is required.' });

  const brand = typeof body.brand === 'string' ? body.brand.trim().slice(0, 100) : '';
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 80) : 'General';
  const price = typeof body.price === 'string' || typeof body.price === 'number' ? String(body.price).slice(0, 30) : '';
  const mrp = typeof body.mrp === 'string' || typeof body.mrp === 'number' ? String(body.mrp).slice(0, 30) : '';
  const details = typeof body.details === 'string' ? body.details.trim().slice(0, 1800) : '';

  const instructions = [
    'Write original, polished Indian ecommerce marketplace copy inspired by the clarity and scannability of leading marketplaces such as Flipkart. Do not claim affiliation with or reproduce proprietary copy from any marketplace.',
    'Return valid JSON with exactly these keys: title (string), bullets (array of exactly 6 short strings), description (string).',
    'Use the supplied product facts only. Do not invent specifications, certifications, warranty, materials, health benefits, compatibility, or included accessories. If details are sparse, use careful generic benefits and avoid unsupported claims.',
    'Title: concise, searchable, natural, product-first; include brand only when supplied and relevant.',
    'Bullets: exactly six distinct, useful points, readable and factual. Do not add numbering in the bullet strings.',
    'Description: one clear, customer-friendly paragraph, not a list. Avoid keyword stuffing, exaggerated claims, emojis, and fake discounts.',
    'Write in English unless the supplied product details clearly indicate another language.'
  ].join(' ');

  const userContent = [
    'Product name: ' + name,
    'Brand: ' + (brand || 'Not supplied'),
    'Category: ' + category,
    'Selling price (context only): ' + (price || 'Not supplied'),
    'MRP (context only): ' + (mrp || 'Not supplied'),
    'Seller-supplied details: ' + (details || 'None supplied')
  ].join('\n');

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: userContent }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res.status(upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 502 : 502).json({
        error: upstream.status === 401 || upstream.status === 403
          ? 'OpenAI rejected the API key. Check OPENAI_API_KEY and API access.'
          : upstream.status === 429
            ? 'OpenAI API rate or usage limit reached. Check your API usage and try again.'
            : 'OpenAI could not generate product copy.',
        providerStatus: upstream.status,
        detail: detail.slice(0, 250)
      });
    }

    const payload = await upstream.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string' || !raw) {
      return res.status(502).json({ error: 'OpenAI returned no product copy.' });
    }

    let parsed;
    try { parsed = JSON.parse(raw); } catch {
      return res.status(502).json({ error: 'OpenAI returned invalid product copy JSON.' });
    }

    const title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, 220) : '';
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean).slice(0, 6)
      : [];
    const description = typeof parsed.description === 'string' ? parsed.description.trim().slice(0, 4000) : '';

    if (!title || bullets.length !== 6 || !description) {
      return res.status(502).json({ error: 'AI response did not contain a title, six bullet points, and a description.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ title, bullets, description });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      error: timeout ? 'Product copy generation timed out. Please retry.' : 'Could not reach OpenAI to generate product copy.'
    });
  }
}
