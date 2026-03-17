const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const POSTHOG_API_URL = `https://us.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query`;

const ACQUISITION_QUERY = `
WITH paying_wallets AS (
  SELECT
    lower(player) AS wallet,
    count() AS total_purchases,
    sum(toFloat(amount) / 1e6) AS total_spent,
    min(logged_at) AS first_purchase_at
  FROM postgres.purchaseevents
  WHERE logged_at >= '2026-02-01'
  GROUP BY lower(player)
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
  GROUP BY lower(distinct_id)
)
SELECT
  coalesce(nullIf(ft.utm_source, ''), 'unknown') AS utm_source,
  coalesce(nullIf(ft.utm_medium, ''), 'unknown') AS utm_medium,
  coalesce(nullIf(ft.utm_campaign, ''), 'unknown') AS utm_campaign,
  coalesce(nullIf(ft.referring_domain, ''), 'direct') AS referring_domain,
  coalesce(nullIf(ft.country, ''), 'unknown') AS country,
  count() AS unique_buyers,
  sum(pw.total_purchases) AS total_purchases,
  round(sum(pw.total_spent), 2) AS total_revenue
FROM paying_wallets pw
LEFT JOIN first_touch ft ON pw.wallet = ft.wallet
GROUP BY utm_source, utm_medium, utm_campaign, referring_domain, country
ORDER BY total_revenue DESC
LIMIT 500
`.trim();

export const fetchAcquisitionFunnel = async () => {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID ||
      POSTHOG_API_KEY === 'your_posthog_personal_api_key_here' ||
      POSTHOG_PROJECT_ID === 'your_project_id_here') {
    throw new Error('PostHog API key and project ID must be configured in .env');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          query: ACQUISITION_QUERY
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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
      throw new Error('PostHog request timeout - please try again');
    }
    throw error;
  }
};
