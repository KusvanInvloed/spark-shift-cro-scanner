// /api/optimize — follow-up optimization calls (herschrijven, alternatieven)
// Gebruikt dezelfde rate limit als /api/scan (deelt quota).

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10; // max 10 optimize-calls per IP per 24 uur (ruimer dan scans)

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.firstRequestAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstRequestAt: now });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetsAt: record.firstRequestAt + RATE_LIMIT_WINDOW_MS };
  }
  record.count++;
  return { allowed: true };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server niet goed geconfigureerd.' });
  }

  const { model, messages, email } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Ongeldige input.' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').split(',')[0].trim();
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Je hebt veel optimalisaties gebruikt. Probeer het morgen weer of gebruik je eigen API-sleutel.',
      upgrade: true
    });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[Anthropic error]', anthropicRes.status, errText);
      return res.status(502).json({ error: 'Optimalisatie mislukt.' });
    }

    const data = await anthropicRes.json();
    return res.status(200).json({ data });
  } catch (err) {
    console.error('[optimize error]', err);
    return res.status(500).json({ error: 'Onverwachte fout: ' + err.message });
  }
}
