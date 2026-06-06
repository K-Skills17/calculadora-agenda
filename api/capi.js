// Vercel Serverless Function — proxies CAPI events to Facebook
// Token stays server-side, never exposed to the browser

const PIXEL_ID = process.env.PIXEL_ID;
const CAPI_ACCESS_TOKEN = process.env.CAPI_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PIXEL_ID || !CAPI_ACCESS_TOKEN) {
    console.error('Missing PIXEL_ID or CAPI_ACCESS_TOKEN env vars');
    return res.status(500).json({ error: 'CAPI not configured' });
  }

  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Missing data array in body' });
    }

    // Inject real client IP from proxy headers
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress;

    for (const event of data) {
      if (event.user_data && clientIp) {
        event.user_data.client_ip_address = clientIp;
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook CAPI error:', result);
      return res.status(response.status).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('CAPI proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
