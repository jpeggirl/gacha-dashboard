/**
 * MCP-based Abstract Tagger
 * 
 * This script provides functions to search and tag users using the MCP browser extension.
 * Run this from within Cursor to use your logged-in browser session.
 * 
 * Usage: 
 *   Import these functions in your Cursor session and call them via MCP tools.
 */

/**
 * Configuration for the tagger
 */
export const CONFIG = {
  PROFILE_URL_BASE: 'https://portal.abs.xyz/profile/',
  TAG_ABSTRACT_FARMER: 'abstract farmer',
  TAG_OUTSIDE_USER: 'outside user',
  TAG_AUTHOR: 'Abstract Tagger Bot'
};

/**
 * MCP workflow to check a single wallet:
 * 
 * 1. Navigate to: https://portal.abs.xyz/profile/{walletAddress}
 * 2. Wait for page to load (3 seconds)
 * 3. Take snapshot and search for "Gold" text
 * 4. If "Gold" found → abstract farmer
 *    If 404/not found or no Gold → outside user
 * 
 * Example MCP sequence:
 * 
 * // Step 1: Navigate to profile
 * browser_navigate({ url: "https://portal.abs.xyz/profile/0x..." })
 * 
 * // Step 2: Wait for load
 * browser_wait_for({ time: 3 })
 * 
 * // Step 3: Take snapshot and check content
 * browser_snapshot({})
 * // Check snapshot for "Gold" or "Page Not Found"
 * 
 * // Step 4: Tag in Supabase based on result
 */

/**
 * Determines the tag based on the page snapshot content
 * @param {string} snapshotContent - The YAML snapshot content from MCP
 * @returns {{ found: boolean, isGold: boolean, tier: string | null }}
 */
export function analyzeSnapshot(snapshotContent) {
  // Check if page not found
  if (snapshotContent.includes('Page Not Found')) {
    return { found: false, isGold: false, tier: null };
  }
  
  // Check for Gold tier indicators
  // Gold tiers: Gold I, Gold II, Gold III, etc.
  const goldMatch = snapshotContent.match(/Gold\s*(?:I{1,3}|IV|V|VI|VII|VIII|IX|X)?/i);
  if (goldMatch) {
    return { found: true, isGold: true, tier: goldMatch[0] };
  }
  
  // Check for other tier indicators (user exists but not gold)
  const tierIndicators = ['Silver', 'Bronze', 'Platinum', 'Diamond'];
  for (const tier of tierIndicators) {
    if (snapshotContent.includes(tier)) {
      return { found: true, isGold: false, tier: tier };
    }
  }
  
  // User might exist but no clear tier indicator
  // Check for profile elements
  if (snapshotContent.includes('Followers') || snapshotContent.includes('Following')) {
    return { found: true, isGold: false, tier: 'Unknown' };
  }
  
  return { found: false, isGold: false, tier: null };
}

/**
 * Determines the appropriate tag based on analysis result
 * @param {{ found: boolean, isGold: boolean, tier: string | null }} result
 * @returns {string}
 */
export function getTagForResult(result) {
  if (!result.found) {
    return CONFIG.TAG_OUTSIDE_USER;
  }
  
  if (result.isGold) {
    return CONFIG.TAG_ABSTRACT_FARMER;
  }
  
  return CONFIG.TAG_OUTSIDE_USER;
}

/**
 * Instructions for manual MCP workflow:
 * 
 * For each wallet address to check:
 * 
 * 1. Use browser_navigate to go to the profile:
 *    { url: "https://portal.abs.xyz/profile/{WALLET_ADDRESS}" }
 * 
 * 2. Use browser_wait_for to wait for page load:
 *    { time: 3 }
 * 
 * 3. Check the snapshot result:
 *    - If "Page Not Found" → tag as "outside user"
 *    - If "Gold" text found → tag as "abstract farmer"
 *    - Otherwise → tag as "outside user"
 * 
 * 4. Update Supabase with the appropriate tag
 */

console.log('MCP Tagger module loaded. Use analyzeSnapshot() to process browser snapshots.');
