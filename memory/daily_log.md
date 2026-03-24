# Daily Log

### 2026-03-24 16:00 — [Feature] Add Total Buyback & Net PnL KPI cards
**What:** Added `fetchWalletPulls` API service (GET /api/pulls/{wallet}), new pullsData state in App.jsx, and two new KPI cards: Total Buyback (sum of buybackAmount/1M) and Net PnL (buyback - spent, color-coded green/red). Added `valueClassName` prop to KPICard for colored values.
**Files:** src/services/api.js, src/App.jsx, src/components/KPICard.jsx
**Result:** Pass — build succeeds, no errors
**Lessons:** Pulls API is at a different base path (`/api/pulls/`) than admin endpoints (`/api/admin/`), so used full URL instead of API_CONFIG.BASE_URL.

### 2026-03-24 15:00 — [Enhancement] Fix Claim ROI misleading metrics
**What:** Two fixes: (1) "User Spend" showed total lifetime spending instead of post-claim spending — switched all metrics and table to use `postClaimSpend`. (2) Same wallet redeeming multiple codes appeared as separate users — added duplicate wallet detection with "(same wallet)" label and dimmed rows. Also updated Net ROI to use unique wallet count for cost basis.
**Files:** src/components/ClaimCodeROI.jsx
**Result:** Pass — build succeeds
**Lessons:** postClaimSpend was already computed and stored but never displayed. Cache already preserves it.

### 2026-03-22 — [Bugfix] Prevent mock data from persisting to Supabase
**What:** When API is unreachable, mock data triggered auto-classification saving fake archetypes to Supabase. Passed `dataSource` prop from App.jsx to ArchetypeSection, UserTags, ProfileComments, and UserProfile. Skipped archetype computation on mock data, added stale archetype reset for wallets with 0 real transactions, disabled all manual write controls (tags, comments, nicknames) when using mock data.
**Files:** src/App.jsx, src/components/ArchetypeSection.jsx, src/components/UserTags.jsx, src/components/ProfileComments.jsx, src/components/UserProfile.jsx
**Result:** Pass — build succeeds, all write paths guarded.
**Lessons:** The `dataSource` state existed but was only used for the banner. Always propagate data-quality signals to components that write to persistent storage.

### 2026-02-22 — [Feature] Claim Code Search in Wallet Search Bar
**What:** Added claim code resolution to the search bar — codes resolve to redeemer wallets, unused codes show error, unknown codes fall through to normal search.
**Files:** src/services/api.js, src/App.jsx, src/components/Header.jsx
**Result:** Pass — build succeeds, all three response states handled.
**Lessons:** looksLikeClaimCode helper avoids unnecessary API calls by filtering out obvious wallets (0x prefix), emails (@/.), and non-alphanumeric inputs before hitting the claim code endpoint.

### 2026-02-22 — [Feature] Claim Code ROI Analytics Section
**What:** Added ClaimCodeROI section to HomePage showing campaign KPIs (codes distributed, redemption rate, cost, redeemer revenue, net ROI) and a sortable/paginated codes table with per-wallet spend data.
**Files:** src/config/constants.js, src/services/api.js, src/components/ClaimCodeROI.jsx (new), src/components/HomePage.jsx
**Result:** Pass — build succeeds, all KPIs computed, progressive wallet loading with progress bar, table sorting/pagination.
**Lessons:** Batch-lookup endpoint response shape unknown — used defensive parsing (tries data.codes, data.results, data.data, raw array). Wallet spend deduplicated by wallet address to avoid double-counting when one wallet redeemed multiple codes.

### 2026-02-23 — [Bugfix] ClaimCodeROI 0% redemption rate
**What:** Fixed two bugs: (1) wallet field mismatch — API returns `claim.redeemWallet` not `claim.walletAddress`, (2) date filter used `claim.createdAt` (code generation date, Feb 7) instead of `claim.claimedAt` (redemption date), causing all redeemed codes to be filtered out before campaign start.
**Files:** src/components/ClaimCodeROI.jsx
**Result:** Pass — build succeeds, both field mappings corrected.
**Lessons:** Always inspect actual API responses before writing field accessors. Batch-lookup claim object uses `redeemWallet` and has both `createdAt` (code creation) and `claimedAt` (redemption) — these are very different dates.

### 2026-02-23 — [Feature] Move ClaimCodeROI to dedicated page
**What:** Extracted ClaimCodeROI from HomePage into its own `claim-codes` view with full-page layout, nav card on homepage, and Home button in header.
**Files:** src/App.jsx, src/components/Header.jsx, src/components/HomePage.jsx
**Result:** Pass — build succeeds, ClaimCodeROI renders on its own page, Home button shows on claim-codes view, wallet navigation from codes table works.
**Lessons:** App uses `currentView` state pattern — adding views is just another `if` block before the default wallet view return.

### 2026-02-23 — [UI] Move Claim ROI nav to header tab
**What:** Replaced the bottom-of-page navigation card with a persistent "Claim ROI" tab in the Header next to "Home". Tab highlights when active. Removed card + unused imports from HomePage.
**Files:** src/components/Header.jsx, src/components/HomePage.jsx, src/App.jsx
**Result:** Pass — build succeeds, tab appears on all views, active state highlights correctly.

### 2026-02-23 — [Feature] Rename KPIs: Codes Redeemed + Conversion Rate
**What:** Changed "Codes Distributed" to "Codes Redeemed" (shows redeemed count). Replaced "Redemption Rate" with "Conversion Rate" — % of redeemers who spent >$20 (own money). Campaign cost now based on redeemed count, not total distributed. Threshold stored as CLAIM_CODE_CONVERSION_THRESHOLD constant.
**Files:** src/components/ClaimCodeROI.jsx, src/config/constants.js
**Result:** Pass — build succeeds, conversion rate only counts wallets with loaded spend data to avoid skewing.
**Lessons:** Conversion denominator uses walletsLoaded (wallets with fetched spend data) not redeemedCount, so the rate stays accurate while wallet data loads progressively.

### 2026-03-19 — [Feature] Customer Archetype Auto-Tagging System
**What:** Implemented behavioral archetype classification (binge-and-gone, binge-episodes, steady-periodic) with dynamic recency model, manual override, and seed script for 20 known wallets.
**Files:** supabase_migration_archetypes.sql (new), src/utils/archetypeClassifier.js (new), src/components/ArchetypeBadge.jsx (new), src/components/ArchetypeSection.jsx (new), src/config/constants.js, src/services/supabaseService.js, src/components/UserProfile.jsx, src/App.jsx, scripts/seed-archetypes.js (new)
**Result:** Pass — build succeeds, all 9 files created/modified.
**Lessons:** Classification thresholds stored in constants.js for easy tuning. Recency model uses gapRatio (currentGap/avgGap) for personalized rhythm detection with 7-day grace period fallback.

### 2026-03-20 — [Feature] Editable Nickname for Anonymous Wallets
**What:** Added inline nickname editing on wallet detail page when user has no twitter/username (shows "Anonymous"). Nicknames persist in Supabase `user_profiles.nickname` column and display across Leaderboard and Archetype Directory.
**Files:** src/components/UserProfile.jsx, src/App.jsx, src/services/supabaseService.js, src/components/Leaderboard.jsx, src/components/ArchetypeDirectory.jsx
**Result:** Pass — build succeeds. Requires `nickname` TEXT column in Supabase `user_profiles` table.
**Lessons:** Reused existing `updateUserProfile` upsert pattern. Bulk fetch with `getNicknamesForWallets` avoids N+1 queries in Leaderboard.

### 2026-03-23 — [Fix] Clean up 222 fake archetype entries from Supabase
**What:** Mock data had polluted Supabase user_profiles with 222 auto-classified archetype entries before the mock data guard (3b200bb) was added. Ran cleanup script to null out archetype fields for all non-override entries. Manual overrides preserved.
**Files:** scripts/cleanup-fake-archetypes.js (new)
**Result:** Pass — 222 entries cleaned, Archetype Directory now only shows manually overridden wallets
**Lessons:** The mock data guard prevents future pollution, but existing stale DB entries need a one-time cleanup. The per-wallet reset logic in ArchetypeSection only fires when visiting individual wallets, not enough for bulk cleanup.

### 2026-03-23 — [Fix] Acquisition Funnel showing old users and missing First Seen dates
**What:** Changed paying_wallets CTE from `WHERE logged_at >= '2026-02-01'` to `HAVING min(logged_at) >= '2026-02-01'` so only truly new customers (first-ever purchase after Feb 2026) appear, excluding returning old buyers.
**Files:** src/services/posthogApi.js
**Result:** Fix applied — needs verification on live data
**Lessons:** When filtering for "new" users, filter on absolute first event (HAVING on min), not on individual events within a date window (WHERE on each row).

### 2026-02-24 — [Feature] Flag New vs Existing Users in Claim Code ROI
**What:** Classify claim code redeemers as "new" or "existing" based on whether they had transactions before their code redemption date. Added split KPI cards (New User Spending, Existing User Spending) and a Type badge column in the table.
**Files:** src/components/ClaimCodeROI.jsx
**Result:** Pass — clean build, walletSpend state changed from number to object { totalSpent, isNewUser, preClaimSpend, postClaimSpend }, all consumers updated.
**Lessons:** Used extractTransactions to normalize paginated/flat transaction responses. Fetching with transactionsLimit=500 to get enough history for classification. Conservative default: wallets without a claim date default to isNewUser=false.
