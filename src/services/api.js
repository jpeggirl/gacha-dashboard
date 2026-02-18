import { API_CONFIG, DEFAULT_TRANSACTIONS_LIMIT, DEFAULT_INVENTORY_LIMIT } from '../config/constants';

/**
 * Fetches pack purchase data for a given identifier (wallet, username, or email)
 * @param {string} identifier - The wallet address, Twitter username, or email to query
 * @param {Object} [paginationOptions] - Pagination options
 * @param {number} [paginationOptions.transactionsPage=1] - Transactions page number
 * @param {number} [paginationOptions.transactionsLimit] - Transactions per page
 * @param {number} [paginationOptions.inventoryPage=1] - Inventory page number
 * @param {number} [paginationOptions.inventoryLimit] - Inventory per page
 * @returns {Promise<Object>} The user data
 * @throws {Error} If the request fails
 */
export const fetchPackPurchases = async (identifier, paginationOptions = {}) => {
  if (!identifier || !identifier.trim()) {
    throw new Error('Search term is required');
  }

  const {
    transactionsPage = 1,
    transactionsLimit = DEFAULT_TRANSACTIONS_LIMIT,
    inventoryPage = 1,
    inventoryLimit = DEFAULT_INVENTORY_LIMIT,
  } = paginationOptions;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const params = new URLSearchParams({
      transactionsPage: String(transactionsPage),
      transactionsLimit: String(transactionsLimit),
      inventoryPage: String(inventoryPage),
      inventoryLimit: String(inventoryLimit),
    });

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACK_PURCHASES}/${encodeURIComponent(identifier)}?${params}`;

    console.log('[API Debug] Fetching from URL:', url);
    console.log('[API Debug] Headers:', {
      'x-admin-password': API_CONFIG.HEADERS['x-admin-password'] ? `***set (length: ${API_CONFIG.HEADERS['x-admin-password'].length})***` : '***missing***',
      'Content-Type': API_CONFIG.HEADERS['Content-Type']
    });
    console.log('[API Debug] Password value check:', {
      fromEnv: import.meta.env.VITE_ADMIN_PASSWORD ? 'set' : 'not set',
      fromConfig: API_CONFIG.HEADERS['x-admin-password'] ? 'set' : 'not set',
      passwordLength: API_CONFIG.HEADERS['x-admin-password']?.length || 0
    });
    console.log('[API Debug] Timeout:', API_CONFIG.TIMEOUT, 'ms');

    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
      signal: controller.signal,
      mode: 'cors' // Explicitly set CORS mode
    });

    clearTimeout(timeoutId);

    console.log('[API Debug] Response status:', response.status, response.statusText);
    console.log('[API Debug] Response headers:', {
      'content-type': response.headers.get('content-type'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin')
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[API Debug] Error response body:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[API Debug] Success! Received data with keys:', Object.keys(data));
    console.log('[API Debug] Free packs data:', {
      totalFreePacksRedeemed: data.totalFreePacksRedeemed,
      freePackRedemptions: data.freePackRedemptions,
      freePackRedemptionsType: Array.isArray(data.freePackRedemptions) ? 'array' : typeof data.freePackRedemptions,
      freePackRedemptionsLength: Array.isArray(data.freePackRedemptions) ? data.freePackRedemptions.length : 'not array',
      freePackRedemptionsSample: Array.isArray(data.freePackRedemptions) ? data.freePackRedemptions.slice(0, 2) : null
    });
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    // Log the actual error for debugging
    console.error('API fetch error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    throw error;
  }
};
