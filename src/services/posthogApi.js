const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const POSTHOG_API_URL = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query`;

// --- Acquisition Funnel Cache ---
const ACQUISITION_CACHE_KEY = 'acquisition_funnel_cache';
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour — skip background refresh if cache is younger

export const getAcquisitionFunnelCache = () => {
  try {
    const raw = localStorage.getItem(ACQUISITION_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (!cache.data || !cache.cachedAt) return null;
    return cache;
  } catch {
    return null;
  }
};

export const isCacheStale = (cachedAt) => {
  if (!cachedAt) return true;
  return Date.now() - new Date(cachedAt).getTime() > CACHE_MAX_AGE_MS;
};

export const saveAcquisitionFunnelCache = (data) => {
  try {
    localStorage.setItem(ACQUISITION_CACHE_KEY, JSON.stringify({
      data,
      cachedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('[AcquisitionFunnel] Failed to save cache:', e);
  }
};

/**
 * Merge incremental results into cached results.
 * Groups by (utm_source, utm_medium, utm_campaign, referring_domain, country).
 * Incremental results contain only NEW wallets (first purchase after sinceDate),
 * so counts can be safely added without double-counting.
 */
export const mergeAcquisitionData = (cachedRows, freshRows) => {
  const keyFn = (row) =>
    `${row.utm_source}|${row.utm_medium}|${row.utm_campaign}|${row.referring_domain}|${row.country}`;

  const map = new Map();

  for (const row of cachedRows) {
    map.set(keyFn(row), { ...row, wallets: [...(row.wallets || [])] });
  }

  for (const row of freshRows) {
    const key = keyFn(row);
    const existing = map.get(key);
    if (existing) {
      const mergedWallets = [...new Set([...existing.wallets, ...(row.wallets || [])])];
      existing.wallets = mergedWallets;
      existing.unique_buyers = mergedWallets.length;
      existing.total_purchases += row.total_purchases;
      existing.total_revenue = Math.round((existing.total_revenue + row.total_revenue) * 100) / 100;
      if (row.first_seen && (!existing.first_seen || new Date(row.first_seen) < new Date(existing.first_seen))) {
        existing.first_seen = row.first_seen;
      }
    } else {
      map.set(key, { ...row, wallets: [...(row.wallets || [])] });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_revenue - a.total_revenue);
};

/**
 * Build acquisition query. When sinceDate is provided, only fetches wallets
 * whose first purchase is on/after sinceDate and limits the events scan
 * to just those wallets (much faster for incremental updates).
 */
const buildAcquisitionQuery = (sinceDate) => {
  return `
WITH paying_wallets AS (
  SELECT
    lower(player) AS wallet,
    count() AS total_purchases,
    sum(toFloat(amount) / 1e6) AS total_spent,
    min(logged_at) AS first_purchase_at
  FROM postgres.purchaseevents
  GROUP BY lower(player)
  HAVING min(logged_at) >= '${sinceDate || '2026-02-01'}'
),
first_touch AS (
  SELECT
    lower(distinct_id) AS wallet,
    argMin(properties.$session_entry_utm_source, timestamp) AS utm_source,
    argMin(properties.$session_entry_utm_medium, timestamp) AS utm_medium,
    argMin(properties.$session_entry_utm_campaign, timestamp) AS utm_campaign,
    argMin(properties.$referring_domain, timestamp) AS referring_domain,
    argMin(properties.$geoip_country_name, timestamp) AS country,
    argMin(properties.$geoip_city_name, timestamp) AS city
  FROM events
  WHERE timestamp >= '2026-02-01'
    AND timestamp <= now()
    AND distinct_id NOT LIKE '$%'
    AND lower(distinct_id) IN (SELECT wallet FROM paying_wallets)
  GROUP BY lower(distinct_id)
)
SELECT
  coalesce(nullIf(ft.utm_source, ''), 'unknown') AS utm_source,
  coalesce(nullIf(ft.utm_medium, ''), 'unknown') AS utm_medium,
  coalesce(nullIf(ft.utm_campaign, ''), 'unknown') AS utm_campaign,
  coalesce(nullIf(ft.referring_domain, ''), 'direct') AS referring_domain,
  coalesce(nullIf(ft.country, ''), 'unknown') AS country,
  min(pw.first_purchase_at) AS first_seen,
  count() AS unique_buyers,
  sum(pw.total_purchases) AS total_purchases,
  round(sum(pw.total_spent), 2) AS total_revenue,
  groupArray(pw.wallet) AS wallets
FROM paying_wallets pw
LEFT JOIN first_touch ft ON pw.wallet = ft.wallet
GROUP BY utm_source, utm_medium, utm_campaign, referring_domain, country
ORDER BY total_revenue DESC
LIMIT 500
`.trim();
};

const WALLET_ACQUISITION_QUERY = (wallet) => `
WITH
  first_utm AS (
    SELECT
      argMin(properties.$session_entry_utm_source, timestamp) AS utm_source,
      argMin(properties.$session_entry_utm_medium, timestamp) AS utm_medium,
      argMin(properties.$session_entry_utm_campaign, timestamp) AS utm_campaign
    FROM events
    WHERE timestamp >= '2026-02-01' AND timestamp <= now()
      AND lower(distinct_id) = lower('${wallet}')
      AND (
        nullIf(properties.$session_entry_utm_source, '') IS NOT NULL
        OR nullIf(properties.$session_entry_utm_medium, '') IS NOT NULL
        OR nullIf(properties.$session_entry_utm_campaign, '') IS NOT NULL
      )
  ),
  first_referrer AS (
    SELECT
      argMin(properties.$referring_domain, timestamp) AS referring_domain
    FROM events
    WHERE timestamp >= '2026-02-01' AND timestamp <= now()
      AND lower(distinct_id) = lower('${wallet}')
      AND nullIf(properties.$referring_domain, '') IS NOT NULL
      AND properties.$referring_domain != '$direct'
  ),
  first_geo AS (
    SELECT
      argMin(properties.$geoip_country_name, timestamp) AS country,
      argMin(properties.$geoip_city_name, timestamp) AS city
    FROM events
    WHERE timestamp >= '2026-02-01' AND timestamp <= now()
      AND lower(distinct_id) = lower('${wallet}')
      AND nullIf(properties.$geoip_country_name, '') IS NOT NULL
  )
SELECT
  coalesce(nullIf(u.utm_source, ''), null) AS utm_source,
  coalesce(nullIf(u.utm_medium, ''), null) AS utm_medium,
  coalesce(nullIf(u.utm_campaign, ''), null) AS utm_campaign,
  coalesce(nullIf(r.referring_domain, ''), null) AS referring_domain,
  coalesce(nullIf(g.country, ''), null) AS country,
  coalesce(nullIf(g.city, ''), null) AS city
FROM first_utm u
CROSS JOIN first_referrer r
CROSS JOIN first_geo g
`.trim();

export const fetchWalletAcquisition = async (walletAddress) => {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID ||
      POSTHOG_API_KEY === 'your_posthog_personal_api_key_here' ||
      POSTHOG_PROJECT_ID === 'your_project_id_here') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(POSTHOG_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: WALLET_ACQUISITION_QUERY(walletAddress)
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const { columns, results } = data;

    if (!results || results.length === 0) return null;

    const row = results[0];
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    // Return null if no meaningful data
    if (!obj.utm_source && !obj.utm_medium && !obj.utm_campaign && !obj.country) {
      return null;
    }

    return obj;
  } catch {
    return null;
  }
};

/**
 * Fetch acquisition funnel data from PostHog with retry logic.
 * @param {string|null} sinceDate - ISO date string for incremental fetch (only new wallets since this date)
 * @param {number} maxRetries - Number of retries on 504/timeout (default 2)
 */
export const fetchAcquisitionFunnel = async (sinceDate = null, maxRetries = 2) => {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID ||
      POSTHOG_API_KEY === 'your_posthog_personal_api_key_here' ||
      POSTHOG_PROJECT_ID === 'your_project_id_here') {
    throw new Error('PostHog API key and project ID must be configured in .env');
  }

  const query = buildAcquisitionQuery(sinceDate);
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 2s, 4s
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(POSTHOG_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POSTHOG_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 504 || response.status === 502 || response.status === 503) {
        const errorText = await response.text().catch(() => '');
        lastError = new Error(`PostHog API Error: ${response.status} - ${errorText}`);
        console.warn(`[AcquisitionFunnel] Attempt ${attempt + 1}/${maxRetries + 1} got ${response.status}, retrying...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        throw new Error(`PostHog API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const { columns, results } = data;

      return results.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        lastError = new Error('PostHog request timeout - please try again');
        console.warn(`[AcquisitionFunnel] Attempt ${attempt + 1}/${maxRetries + 1} timed out, retrying...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};
