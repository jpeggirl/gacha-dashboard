#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AbstractBrowser from './browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  ADMIN_PASSWORD: process.env.VITE_ADMIN_PASSWORD,
  LEADERBOARD_API: 'https://api-pull.gacha.game/api/leaderboard/total',
  // Run every hour by default
  CRON_SCHEDULE: process.env.TAGGER_CRON_SCHEDULE || '0 * * * *',
  // Tags to apply
  TAG_ABSTRACT_FARMER: 'abstract farmer',
  TAG_OUTSIDE_USER: 'outside user',
  // Author name for tags
  TAG_AUTHOR: 'Abstract Tagger Bot'
};

// Initialize Supabase client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

/**
 * Fetch leaderboard data from the API
 * @returns {Promise<Array<{wallet_address: string}>>}
 */
async function fetchLeaderboard() {
  console.log('[Leaderboard] Fetching leaderboard data...');
  
  try {
    const response = await fetch(CONFIG.LEADERBOARD_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': CONFIG.ADMIN_PASSWORD
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Leaderboard] Fetched ${data.length || 0} users`);
    return data || [];
  } catch (error) {
    console.error('[Leaderboard] Error fetching leaderboard:', error.message);
    return [];
  }
}

/**
 * Get untagged users from the leaderboard
 * @param {Array<{wallet_address: string}>} leaderboardUsers
 * @returns {Promise<string[]>} - Array of untagged wallet addresses
 */
async function getUntaggedUsers(leaderboardUsers) {
  console.log('[Supabase] Checking for untagged users...');
  
  const walletAddresses = leaderboardUsers.map(u => u.wallet || u.wallet_address || u.walletAddress || u.address).filter(Boolean);
  
  if (walletAddresses.length === 0) {
    return [];
  }

  try {
    // Fetch all profiles for the given wallet addresses
    const { data, error } = await supabase
      .from('user_profiles')
      .select('wallet_address, tags')
      .in('wallet_address', walletAddresses);

    if (error) throw error;

    // Create a set of tagged wallet addresses (those with non-empty tags)
    const taggedAddresses = new Set();
    if (data) {
      data.forEach(profile => {
        if (Array.isArray(profile.tags) && profile.tags.length > 0) {
          taggedAddresses.add(profile.wallet_address.toLowerCase());
        }
      });
    }

    // Filter to get only untagged addresses
    const untaggedAddresses = walletAddresses.filter(addr => 
      !taggedAddresses.has(addr.toLowerCase())
    );

    console.log(`[Supabase] Found ${untaggedAddresses.length} untagged users out of ${walletAddresses.length} total`);
    return untaggedAddresses;
  } catch (error) {
    console.error('[Supabase] Error checking untagged users:', error.message);
    return [];
  }
}

/**
 * Add a tag to a user in Supabase
 * @param {string} walletAddress
 * @param {string} tag
 */
async function addTag(walletAddress, tag) {
  try {
    // First, try to get existing profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    
    let tags = [];
    if (existingProfile && existingProfile.tags) {
      tags = Array.isArray(existingProfile.tags) ? [...existingProfile.tags] : [];
    }

    // Check if tag already exists
    if (tags.includes(tag)) {
      return { success: true, alreadyExists: true };
    }

    // Add the new tag
    tags.push(tag);

    // Upsert the profile
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: walletAddress,
        tags: tags,
        created_by: CONFIG.TAG_AUTHOR,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (error) throw error;
    
    console.log(`[Supabase] Tagged ${walletAddress} as "${tag}"`);
    return { success: true, alreadyExists: false };
  } catch (error) {
    console.error(`[Supabase] Error adding tag to ${walletAddress}:`, error.message);
    return { success: false, error };
  }
}

/**
 * Process a single wallet address
 * @param {AbstractBrowser} browser
 * @param {string} walletAddress
 */
async function processWallet(browser, walletAddress) {
  console.log(`\n[Process] Processing wallet: ${walletAddress}`);
  
  const result = await browser.searchWallet(walletAddress);
  
  if (!result.found) {
    // User not found on Abstract Portal -> tag as "outside user"
    await addTag(walletAddress, CONFIG.TAG_OUTSIDE_USER);
  } else if (result.isGold) {
    // Gold tier user -> tag as "abstract farmer"
    await addTag(walletAddress, CONFIG.TAG_ABSTRACT_FARMER);
  } else {
    // Found but not gold -> tag as "outside user"
    await addTag(walletAddress, CONFIG.TAG_OUTSIDE_USER);
  }
  
  // Add a small delay between requests to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Main job function - runs the full tagging workflow
 */
async function runTaggingJob() {
  console.log('\n========================================');
  console.log('[Job] Starting Abstract Tagger job...');
  console.log(`[Job] Time: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
  const browser = new AbstractBrowser();
  
  try {
    // Initialize browser
    await browser.init(true); // Run headless
    await browser.navigateToPortal();
    
    // Check if logged in
    const loggedIn = await browser.isLoggedIn();
    if (!loggedIn) {
      console.error('[Job] Not logged in to Abstract Portal. Please run setup first.');
      console.error('[Job] Run: npm run setup');
      await browser.close();
      return;
    }
    
    // Fetch leaderboard
    const leaderboardUsers = await fetchLeaderboard();
    if (leaderboardUsers.length === 0) {
      console.log('[Job] No users in leaderboard. Exiting.');
      await browser.close();
      return;
    }
    
    // Get untagged users
    const untaggedUsers = await getUntaggedUsers(leaderboardUsers);
    if (untaggedUsers.length === 0) {
      console.log('[Job] All users are already tagged. Nothing to do.');
      await browser.close();
      return;
    }
    
    console.log(`[Job] Processing ${untaggedUsers.length} untagged users...`);
    
    // Process each untagged user
    for (const walletAddress of untaggedUsers) {
      await processWallet(browser, walletAddress);
    }
    
    console.log('\n[Job] Tagging job completed successfully!');
    
  } catch (error) {
    console.error('[Job] Error during tagging job:', error.message);
  } finally {
    await browser.close();
  }
}

/**
 * Setup mode - opens browser for manual login
 */
async function runSetup() {
  console.log('\n========================================');
  console.log('[Setup] Abstract Tagger Setup');
  console.log('========================================\n');
  console.log('This will open a browser window for you to log in to Abstract Portal.');
  console.log('Your session will be saved for future automated runs.\n');
  
  const browser = new AbstractBrowser();
  
  try {
    // Initialize browser in visible mode
    await browser.init(false); // Not headless
    await browser.navigateToPortal();
    
    console.log('\nBrowser opened. Please log in using your Google account (dev@sosleek.io).');
    console.log('The script will wait until login is detected...\n');
    
    // Wait for login
    await browser.waitForLogin();
    
    console.log('\n[Setup] Login successful! Session has been saved.');
    console.log('[Setup] You can now run the daemon with: npm run daemon');
    
  } catch (error) {
    console.error('[Setup] Error during setup:', error.message);
  } finally {
    await browser.close();
  }
}

/**
 * Daemon mode - runs the job on a schedule
 */
async function runDaemon() {
  console.log('\n========================================');
  console.log('[Daemon] Abstract Tagger Daemon');
  console.log(`[Daemon] Schedule: ${CONFIG.CRON_SCHEDULE}`);
  console.log('========================================\n');
  
  // Run immediately on start
  await runTaggingJob();
  
  // Schedule future runs
  cron.schedule(CONFIG.CRON_SCHEDULE, async () => {
    await runTaggingJob();
  });
  
  console.log('[Daemon] Scheduler started. Press Ctrl+C to stop.');
}

/**
 * Run a single job (for testing)
 */
async function runOnce() {
  await runTaggingJob();
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--setup')) {
  runSetup();
} else if (args.includes('--daemon')) {
  runDaemon();
} else if (args.includes('--once')) {
  runOnce();
} else {
  console.log(`
Abstract Tagger - Automatic tagging agent for Abstract Portal users

Usage:
  node index.js --setup    First-time setup: opens browser for manual login
  node index.js --daemon   Start the background daemon (runs on schedule)
  node index.js --once     Run the tagging job once and exit

Environment Variables:
  TAGGER_CRON_SCHEDULE    Cron schedule for daemon mode (default: "0 * * * *" - every hour)

Examples:
  npm run setup           Log in to Abstract Portal (first time only)
  npm run daemon          Start the daemon
  npm run start -- --once Run once for testing
`);
  process.exit(0);
}
