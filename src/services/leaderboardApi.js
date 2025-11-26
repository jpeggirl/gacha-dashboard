import { API_CONFIG } from '../config/constants';

/**
 * Fetches leaderboard data
 * @param {string} type - 'total' or 'weekly'
 * @returns {Promise<Object>} The leaderboard data
 * @throws {Error} If the request fails
 */
export const fetchLeaderboard = async (type = 'total') => {
  if (type !== 'total' && type !== 'weekly') {
    throw new Error('Leaderboard type must be "total" or "weekly"');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const url = `https://api-pull.gacha.game/api/leaderboard/${type}`;
    
    console.log('[Leaderboard API] Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add admin password if needed
        ...(API_CONFIG.HEADERS['x-admin-password'] && {
          'x-admin-password': API_CONFIG.HEADERS['x-admin-password']
        })
      },
      signal: controller.signal,
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    console.log('[Leaderboard API] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[Leaderboard API] Error response body:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Leaderboard API] Success! Received data:', data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    
    console.error('Leaderboard API fetch error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};

