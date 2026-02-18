/**
 * Extracts transactions from the API response, handling both the new paginated
 * format ({ data, page, limit, total, totalPages }) and the legacy flat array.
 *
 * @param {Array|Object} raw - Either a flat transaction array or paginated object
 * @returns {{ items: Array, page: number, limit: number, total: number, totalPages: number }}
 */
export const extractTransactions = (raw) => {
  // New API: paginated object
  if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
    return {
      items: raw.data,
      page: raw.page ?? 1,
      limit: raw.limit ?? raw.data.length,
      total: raw.total ?? raw.data.length,
      totalPages: raw.totalPages ?? 1,
    };
  }

  // Legacy / mock: flat array
  if (Array.isArray(raw)) {
    return {
      items: raw,
      page: 1,
      limit: raw.length,
      total: raw.length,
      totalPages: 1,
    };
  }

  // Fallback: no data
  return { items: [], page: 1, limit: 20, total: 0, totalPages: 1 };
};

/**
 * Extracts inventory wins from the API response, handling both paginated and flat formats.
 *
 * @param {Array|Object|undefined} raw - Either a flat array or paginated object
 * @returns {{ items: Array, page: number, limit: number, total: number, totalPages: number }}
 */
export const extractInventory = (raw) => {
  // New API: paginated object
  if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
    return {
      items: raw.data,
      page: raw.page ?? 1,
      limit: raw.limit ?? raw.data.length,
      total: raw.total ?? raw.data.length,
      totalPages: raw.totalPages ?? 1,
    };
  }

  // Flat array
  if (Array.isArray(raw)) {
    return {
      items: raw,
      page: 1,
      limit: raw.length,
      total: raw.length,
      totalPages: 1,
    };
  }

  // No inventory data
  return { items: [], page: 1, limit: 20, total: 0, totalPages: 1 };
};
