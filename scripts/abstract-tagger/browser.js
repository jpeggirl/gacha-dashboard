import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store browser session data
const USER_DATA_DIR = path.join(__dirname, '.browser-data');

/**
 * Browser automation for Abstract Portal (abs.xyz)
 */
export class AbstractBrowser {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser with persistent context for session storage
   * @param {boolean} headless - Run in headless mode (false for setup/login)
   */
  async init(headless = true) {
    console.log(`[Browser] Initializing browser (headless: ${headless})...`);
    
    this.browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless,
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    
    this.context = this.browser;
    this.page = this.context.pages()[0] || await this.context.newPage();
    
    console.log('[Browser] Browser initialized successfully');
  }

  /**
   * Navigate to Abstract Portal and wait for it to load
   */
  async navigateToPortal() {
    console.log('[Browser] Navigating to Abstract Portal...');
    await this.page.goto('https://portal.abs.xyz', { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content to load
    await this.page.waitForTimeout(2000);
    console.log('[Browser] Portal loaded');
  }

  /**
   * Check if user is logged in by looking for auth indicators
   * @returns {boolean}
   */
  async isLoggedIn() {
    try {
      // Look for common logged-in indicators (wallet balance, profile icon, etc.)
      // The portal shows "$0.00" or a balance when logged in
      const balanceIndicator = await this.page.locator('text=/\\$[0-9]/')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      
      return balanceIndicator;
    } catch {
      return false;
    }
  }

  /**
   * Wait for manual login during setup
   */
  async waitForLogin() {
    console.log('[Browser] Waiting for manual login...');
    console.log('[Browser] Please log in using dev@sosleek.io in the browser window.');
    console.log('[Browser] Press Enter in the terminal once logged in...');
    
    // Poll for login status
    let loggedIn = false;
    while (!loggedIn) {
      await this.page.waitForTimeout(5000);
      loggedIn = await this.isLoggedIn();
      if (!loggedIn) {
        console.log('[Browser] Still waiting for login...');
      }
    }
    
    console.log('[Browser] Login detected! Session will be saved.');
  }

  /**
   * Search for a wallet address on Abstract Portal by navigating directly to profile
   * @param {string} walletAddress - The wallet address to search
   * @returns {{found: boolean, isGold: boolean, username: string|null, tier: string|null}}
   */
  async searchWallet(walletAddress) {
    console.log(`[Browser] Checking wallet: ${walletAddress}`);
    
    try {
      // Navigate directly to the user's profile page
      const profileUrl = `https://portal.abs.xyz/profile/${walletAddress}`;
      await this.page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait for page to fully load
      await this.page.waitForTimeout(3000);
      
      // Get page content
      const pageContent = await this.page.content();
      
      // Check if page not found (user doesn't exist on Abstract)
      if (pageContent.includes('Page Not Found')) {
        console.log(`[Browser] No user found for wallet: ${walletAddress}`);
        return { found: false, isGold: false, username: null, tier: null };
      }
      
      // Check for Gold tier badge
      // Gold tiers appear as: Gold I, Gold II, Gold III, etc.
      const goldMatch = pageContent.match(/Gold\s*(?:I{1,3}|IV|V|VI|VII|VIII|IX|X)?/i);
      const isGold = !!goldMatch;
      const tier = goldMatch ? goldMatch[0] : null;
      
      // Try to get username from h1 heading
      let username = null;
      try {
        const usernameElement = await this.page.locator('h1').first();
        username = await usernameElement.textContent();
        username = username?.trim() || null;
      } catch {
        // Username not found
      }

      console.log(`[Browser] Found user: ${username || 'Unknown'}, Tier: ${tier || 'None'}, Gold: ${isGold}`);
      
      return { found: true, isGold, username, tier };

    } catch (error) {
      console.error(`[Browser] Error checking wallet: ${error.message}`);
      return { found: false, isGold: false, username: null, tier: null };
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      console.log('[Browser] Browser closed');
    }
  }
}

export default AbstractBrowser;
