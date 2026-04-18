// /api/scan — Spark & Shift CRO Scanner
// Serverless proxy naar Anthropic met rate limiting en lead capture.
// Gebruikt Patricia's API-key (env var ANTHROPIC_API_KEY).

// Simpele in-memory rate limiter (reset bij cold start).
// Voor productie: vervang door Vercel KV of Upstash Redis.
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 uur
const RATE_LIMIT_MAX = 2; // max 2 gratis scans per IP per 24 uur

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.firstRequestAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstRequestAt: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    const resetsAt = record.firstRequestAt + RATE_LIMIT_WINDOW_MS;
    return { allowed: false, remaining: 0, resetsAt };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Lead capture: stuur e-mail naar een webhook als die is ingesteld.
// Anders log naar console (zichtbaar in Vercel logs).
async function captureLeadToWebhook(email, name, scanType) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  const leadData = {
    source: 'spark-shift-cro-scanner',
    email,
    name: name || null,
    scan_type: scanType,
    timestamp: new Date().toISOString()
  };
  console.log('[LEAD]', JSON.stringify(leadData));
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
  } catch (err) {
    console.error('[LEAD webhook failed]', err.message);
  }
}

export default async function handler(req, res) {
  // CORS voor eigen domein
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server niet goed geconfigureerd. Neem contact op.' });
  }

  const { email, name, model, systemPrompt, messages, scanType } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Vul een geldig e-mailadres in.' });
  }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Ongeldige scan-input.' });
  }

  // IP-based rate limit
  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').split(',')[0].trim();
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const minutesLeft = Math.ceil((limit.resetsAt - Date.now()) / 60000);
    return res.status(429).json({
      error: 'Je hebt je gratis scans voor vandaag gebruikt.',
      upgrade: true,
      minutesLeft
    });
  }

  // Lead capture
  await captureLeadToWebhook(email, name, scanType || 'unknown');

  // Claude API call
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
        max_tokens: 8000,
        system: systemPrompt,
        messages
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[Anthropic error]', anthropicRes.status, errText);
      return res.status(502).json({ error: 'Scan mislukt. Probeer het straks nog eens.' });
    }

    const data = await anthropicRes.json();
    return res.status(200).json({
      data,
      remaining: limit.remaining
    });
  } catch (err) {
    console.error('[scan error]', err);
    return res.status(500).json({ error: 'Onverwachte fout: ' + err.message });
  }
}
