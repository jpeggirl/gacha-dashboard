import { API_CONFIG } from '../config/constants';

const REPORT_ID = 'dd3b02be-f916-4857-8103-e263d01c3248';

/**
 * Fetches report data (Today's and All-Time pack purchases)
 * @param {number} retries - Number of retry attempts (default: 1)
 * @returns {Promise<Object>} The report data with today and overall stats
 * @throws {Error} If the request fails
 */
export const fetchReport = async (retries = 1) => {
  // Use a longer timeout for report endpoint (30 seconds)
  const REPORT_TIMEOUT = 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REPORT_TIMEOUT);

  try {
    const url = `https://api-pull.gacha.game/api/report/${REPORT_ID}`;
    
    console.log('[Report API] Fetching from URL:', url);
    console.log('[Report API] Timeout set to:', REPORT_TIMEOUT, 'ms');
    console.log('[Report API] Headers:', { 
      'x-admin-password': API_CONFIG.HEADERS['x-admin-password'] ? `***set (length: ${API_CONFIG.HEADERS['x-admin-password'].length})***` : '***missing***',
      'Content-Type': 'application/json'
    });
    
    const startTime = Date.now();
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
    const elapsedTime = Date.now() - startTime;
    console.log('[Report API] Request completed in:', elapsedTime, 'ms');

    console.log('[Report API] Response status:', response.status, response.statusText);
    console.log('[Report API] Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[Report API] Error response body:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Report API] Success! Received data with keys:', Object.keys(data));
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for timeout errors
    if (error.name === 'AbortError' && retries > 0) {
      console.log('[Report API] Request timed out. Retrying...', retries, 'attempts remaining');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return fetchReport(retries - 1);
    }
    
    if (error.name === 'AbortError') {
      console.error('[Report API] Request timed out after', REPORT_TIMEOUT, 'ms');
      throw new Error(`Request timeout after ${REPORT_TIMEOUT / 1000}s - The API may be slow or unavailable. Please try again.`);
    }
    
    console.error('[Report API] Fetch error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};

