# Project Memory — Gacha Dashboard

## Stack
- React + Vite, deployed on Vercel
- API: `https://api-pull.gacha.game/api/admin` with `x-admin-password` header
- Supabase for user tags/comments

## Key Files
- `src/services/api.js` — API client (fetchPackPurchases, fetchClaimCode, fetchClaimCodeBatch)
- `src/App.jsx` — Main app state, search/fetch orchestration
- `src/config/constants.js` — API_CONFIG, endpoints, pack definitions
- `src/components/Header.jsx` — Search bar and nav

## Patterns
- Search flow: App.jsx `fetchData` → api.js fetch → set state → derive analytics via useMemo
- Mock data fallback on API failure (generateMockData)
- Pagination state managed in App.jsx, passed as options to fetchData
- Claim codes: 6-12 alphanumeric, resolved via `/claim-codes/:code/profile` endpoint
- Batch lookup: `POST /claim-codes/batch-lookup` with `{ codes: [], page, limit }` — response shape defensive
- ClaimCodeROI component: self-contained on HomePage, progressive wallet spend loading in batches of 5
- Campaign constants: CLAIM_CODE_COST=15, CAMPAIGN_START_DATE='2026-02-10'
