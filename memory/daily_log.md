# Daily Log

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

### 2026-02-24 — [Feature] Flag New vs Existing Users in Claim Code ROI
**What:** Classify claim code redeemers as "new" or "existing" based on whether they had transactions before their code redemption date. Added split KPI cards (New User Spending, Existing User Spending) and a Type badge column in the table.
**Files:** src/components/ClaimCodeROI.jsx
**Result:** Pass — clean build, walletSpend state changed from number to object { totalSpent, isNewUser, preClaimSpend, postClaimSpend }, all consumers updated.
**Lessons:** Used extractTransactions to normalize paginated/flat transaction responses. Fetching with transactionsLimit=500 to get enough history for classification. Conservative default: wallets without a claim date default to isNewUser=false.
