// Type definitions for the application

/**
 * @typedef {Object} PackDefinition
 * @property {string} name - Pack name
 * @property {number} price - Pack price in USD
 */

/**
 * @typedef {Object} Transaction
 * @property {string} txHash - Transaction hash
 * @property {number} packAmount - Amount spent on pack
 * @property {string} loggedAt - ISO date string
 */

/**
 * @typedef {Object} PackBreakdown
 * @property {string} packName - Name of the pack
 * @property {number} packAmount - Price of the pack
 * @property {number} count - Number of purchases
 * @property {number} totalSpent - Total spent on this pack
 */

/**
 * @typedef {Object} WalletData
 * @property {string} wallet - Wallet address
 * @property {number} totalPacks - Total number of packs purchased
 * @property {number} totalSpent - Total amount spent
 * @property {PackBreakdown[]} packBreakdown - Breakdown by pack type
 * @property {Transaction[]} transactions - List of transactions
 */

/**
 * @typedef {Object} PieDataItem
 * @property {string} name - Pack name
 * @property {number} value - Total spent on this pack
 * @property {number} count - Number of purchases
 */

/**
 * @typedef {Object} ChartDataItem
 * @property {string} date - Date string
 * @property {number} amount - Amount spent on this date
 */

/**
 * @typedef {Object} ProcessedStats
 * @property {string} wallet - Wallet address
 * @property {number} totalSpent - Total amount spent
 * @property {number} totalPacks - Total number of packs
 * @property {number} avgOrderValue - Average order value
 * @property {PieDataItem[]} pieData - Data for pie chart
 * @property {ChartDataItem[]} chartData - Data for bar chart
 * @property {string} tier - User tier
 * @property {Object<string, string>} priceToNameMap - Map of price to pack name
 * @property {Transaction[]} transactions - List of transactions
 */

