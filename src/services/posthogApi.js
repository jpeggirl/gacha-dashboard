const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const POSTHOG_API_URL = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query`;

// --- Acquisition Funnel Cache ---
const ACQUISITION_CACHE_KEY = 'acquisition_funnel_cache_v2'; // v2: includes all users, improved labels
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

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

// --- Shared HogQL query runner with retry on 5xx ---
const runHogQLQuery = async (queryStr, timeoutMs = 30000, maxRetries = 1) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(POSTHOG_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POSTHOG_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: queryStr } }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status >= 500) {
        const errorText = await response.text().catch(() => '');
        lastError = new Error(`PostHog ${response.status}: ${errorText}`);
        console.warn(`[PostHog] Attempt ${attempt + 1}/${maxRetries + 1} got ${response.status}, retrying...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`PostHog ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.results.map(row => {
        const obj = {};
        data.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        lastError = new Error('PostHog request timeout');
        console.warn(`[PostHog] Attempt ${attempt + 1}/${maxRetries + 1} timed out, retrying...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

// --- Two-step acquisition funnel (avoids cross-datasource subquery) ---

/**
 * Step 1: Get paying wallets from the Postgres data source.
 * This query only touches postgres.purchaseevents — no ClickHouse events scan.
 */
const fetchPayingWallets = (sinceDate) => {
  const query = `
SELECT
  lower(player) AS wallet,
  count() AS total_purchases,
  sum(toFloat(amount) / 1e6) AS total_spent,
  min(logged_at) AS first_purchase_at
FROM postgres.purchaseevents
GROUP BY lower(player)
HAVING min(logged_at) >= '${sinceDate || '2026-02-01'}'
`.trim();

  return runHogQLQuery(query, 20000, 1);
};

/**
 * Step 2: Get first-touch attribution for a batch of wallets.
 * Uses an explicit IN list — no cross-datasource subquery.
 */
const fetchFirstTouchBatch = (wallets) => {
  if (wallets.length === 0) return Promise.resolve([]);

  const inList = wallets.map(w => `'${w.replace(/'/g, "''")}'`).join(', ');
  const query = `
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
  AND lower(distinct_id) IN (${inList})
GROUP BY lower(distinct_id)
`.trim();

  return runHogQLQuery(query, 30000, 1);
};

/**
 * Normalize referring_domain: strip PostHog's '$direct' prefix,
 * treat empty/null as 'direct'.
 */
const normalizeReferrer = (ref) => {
  if (!ref || ref === '$direct' || ref === '') return 'direct';
  return ref;
};

/**
 * Client-side join: combine paying wallet data with first-touch attribution,
 * then group by (source, medium, campaign, referrer, country).
 *
 * Source/medium derivation (matches PostHog's classification):
 *   - Has utm_source → use it (e.g. ig, fb, t.co, email)
 *   - No utm but has referring_domain → source = referrer, medium = 'referral'
 *   - Neither → 'Direct / Organic', medium = 'none'
 */
const joinAndGroup = (payingWallets, touchData) => {
  const touchMap = new Map(touchData.map(t => [t.wallet, t]));
  const groups = new Map();

  for (const pw of payingWallets) {
    const touch = touchMap.get(pw.wallet) || {};
    const rawRef = normalizeReferrer(touch.referring_domain);
    const hasUtm = !!touch.utm_source;
    const hasReferrer = rawRef !== 'direct';

    const utm_source = hasUtm ? touch.utm_source : hasReferrer ? rawRef : 'Direct / Organic';
    const utm_medium = touch.utm_medium || (hasReferrer && !hasUtm ? 'referral' : 'none');
    const utm_campaign = touch.utm_campaign || 'none';
    const referring_domain = rawRef;
    const country = touch.country || 'unknown';

    const key = `${utm_source}|${utm_medium}|${utm_campaign}|${referring_domain}|${country}`;
    const existing = groups.get(key);

    if (existing) {
      existing.wallets.push(pw.wallet);
      existing.unique_buyers++;
      existing.total_purchases += pw.total_purchases;
      existing.total_revenue = Math.round((existing.total_revenue + pw.total_spent) * 100) / 100;
      if (pw.first_purchase_at && (!existing.first_seen || new Date(pw.first_purchase_at) < new Date(existing.first_seen))) {
        existing.first_seen = pw.first_purchase_at;
      }
    } else {
      groups.set(key, {
        utm_source,
        utm_medium,
        utm_campaign,
        referring_domain,
        country,
        first_seen: pw.first_purchase_at,
        unique_buyers: 1,
        total_purchases: pw.total_purchases,
        total_revenue: Math.round(pw.total_spent * 100) / 100,
        wallets: [pw.wallet]
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.total_revenue - a.total_revenue);
};

/**
 * Fetch acquisition funnel data using two separate PostHog queries
 * (Postgres for purchase data, ClickHouse for attribution) then join client-side.
 * This avoids the cross-datasource CTE subquery that caused 504 timeouts.
 */
export const fetchAcquisitionFunnel = async (sinceDate = null) => {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID ||
      POSTHOG_API_KEY === 'your_posthog_personal_api_key_here' ||
      POSTHOG_PROJECT_ID === 'your_project_id_here') {
    throw new Error('PostHog API key and project ID must be configured in .env');
  }

  // Step 1: Get paying wallets from Postgres
  const payingWallets = await fetchPayingWallets(sinceDate);
  if (payingWallets.length === 0) return [];

  console.log(`[AcquisitionFunnel] Found ${payingWallets.length} paying wallets, fetching attribution...`);

  // Step 2: Fetch first-touch attribution in parallel batches
  const BATCH_SIZE = 50;
  const walletAddresses = payingWallets.map(w => w.wallet);
  const batches = [];
  for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE) {
    batches.push(walletAddresses.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.allSettled(
    batches.map(batch => fetchFirstTouchBatch(batch))
  );

  const allTouches = [];
  batchResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allTouches.push(...result.value);
    } else {
      console.warn(`[AcquisitionFunnel] Attribution batch ${i + 1}/${batches.length} failed:`, result.reason?.message);
    }
  });

  console.log(`[AcquisitionFunnel] Got attribution for ${allTouches.length}/${payingWallets.length} wallets`);

  // Step 3: Join and group client-side
  return joinAndGroup(payingWallets, allTouches);
};

// --- Per-wallet acquisition (for wallet profile page) ---

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
