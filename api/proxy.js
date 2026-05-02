const UPSTREAM = 'https://api-pull.gacha.game';

export default async function handler(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
  }

  // Extract the target path from the query parameter
  const targetPath = req.query.path;
  if (!targetPath) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  // Build upstream URL, preserving other query params
  const params = new URLSearchParams(req.query);
  params.delete('path');
  const qs = params.toString();
  const upstreamUrl = `${UPSTREAM}${targetPath}${qs ? '?' + qs : ''}`;

  // Build headers — forward content-type, add admin password
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': adminPassword,
  };

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(upstreamUrl, fetchOptions);

    // Forward status and content-type
    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (error) {
    console.error('[Proxy] Upstream request failed:', error.message);
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
