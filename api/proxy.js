import crypto from 'crypto';

const UPSTREAM = 'https://api-pull.gacha.game';

/**
 * Mint a short-lived HS256 JWT for the upstream admin API.
 * The backend expects issuer "gacha-admin" and verifies with ADMIN_JWT_SECRET.
 */
function mintServiceJwt(secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'gacha-admin',
    sub: 'dashboard-service',
    email: 'dashboard@gacha.game',
    role: 'super_admin',
    iat: now,
    exp: now + 300, // 5-minute expiry — minted per request
  };

  const b64 = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64url');

  const unsigned = `${b64(header)}.${b64(payload)}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url');

  return `${unsigned}.${sig}`;
}

export default async function handler(req, res) {
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Server misconfigured: ADMIN_JWT_SECRET not set' });
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

  // Build headers — JWT auth for admin endpoints
  const token = mintServiceJwt(jwtSecret);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
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
