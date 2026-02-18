# Claim Code Lookup API Plan

## Goal

Enable admins to search a free-pack claim code (example: `NVSSE9GZ`) and retrieve:

- The wallet address that redeemed the code
- Redemption metadata (timestamp, tx hash, preset)
- A dashboard-ready wallet profile payload to support onboarding/retention analysis

This plan is for backend/API implementation first. Frontend can consume these endpoints after API delivery.

## Current Data Source

Use existing Supabase table (from exported CSV):

- `id`
- `created_at`
- `updated_at`
- `code`
- `isAvailable`
- `redeem_tx`
- `redeem_preset_id`
- `redeem_wallet`
- `redeemable_preset`

### Key Mapping

- Claim code: `code`
- Redeemed wallet: `redeem_wallet`
- Claimed timestamp (MVP): `updated_at`
- Redemption transaction: `redeem_tx`

## Functional Requirements

1. Admin can query by claim code.
2. API returns whether code exists.
3. API returns whether code has been redeemed.
4. If redeemed, API returns `redeem_wallet` and redemption metadata.
5. API can optionally return wallet profile/activity summary for dashboard rendering.
6. Search should be case-insensitive and trimmed.

## Proposed API Endpoints

## 1) Claim Code Lookup (single code)

`GET /api/claim-codes/:code`

### Request

- Path param: `code` (string, required)
- Server should normalize with `trim()` and uppercase for matching.

### Response (200)

```json
{
  "code": "NVSSE9GZ",
  "exists": true,
  "isRedeemed": true,
  "claim": {
    "id": 1002,
    "redeemWallet": "0x8d0f08676212bc865338190C9cfCb65629ecFcB5",
    "redeemTx": "0x57275ade6c5b26fe18897f4bddc294a804982e4a892b64e940a61a169280567b",
    "redeemPresetId": 1002150005,
    "redeemablePreset": 1002,
    "claimedAt": "2026-02-07T05:34:18.884744Z",
    "createdAt": "2026-02-07T04:55:44.545553Z"
  }
}
```

### Response (code exists, not redeemed)

```json
{
  "code": "ABC12345",
  "exists": true,
  "isRedeemed": false,
  "claim": null
}
```

### Response (404: code not found)

```json
{
  "code": "ABC12345",
  "exists": false,
  "isRedeemed": false,
  "claim": null
}
```

## 2) Claim + Wallet Profile Summary (dashboard-ready)

`GET /api/claim-codes/:code/profile`

### Behavior

1. Resolve code from `freePacks` table.
2. Extract `redeem_wallet`.
3. Query existing wallet analytics/user profile sources.
4. Return combined object for dashboard.

### Response (200)

```json
{
  "code": "NVSSE9GZ",
  "claim": {
    "redeemWallet": "0x8d0f08676212bc865338190C9cfCb65629ecFcB5",
    "claimedAt": "2026-02-07T05:34:18.884744Z",
    "redeemTx": "0x57275ade6c5b26fe18897f4bddc294a804982e4a892b64e940a61a169280567b"
  },
  "walletProfile": {
    "walletAddress": "0x8d0f08676212bc865338190C9cfCb65629ecFcB5",
    "totalPurchaseAmount": 0,
    "totalWinnings": 0,
    "totalTransactions": 0,
    "lastInteractionAt": null,
    "tags": []
  },
  "retention": {
    "hasActivityAfterClaim": false,
    "d1Active": false,
    "d7Active": false,
    "d30Active": false,
    "spend7d": 0,
    "spend30d": 0
  }
}
```

## Supabase Query Specification

Use parameterized query via Supabase JS:

1. Lookup code:
   - table: `freePacks` (confirm exact casing in project)
   - filter: `.ilike('code', normalizedCode)`
   - projection:
     - `id`
     - `code`
     - `created_at`
     - `updated_at`
     - `isAvailable`
     - `redeem_tx`
     - `redeem_preset_id`
     - `redeem_wallet`
     - `redeemable_preset`
2. Claimed condition (MVP):
   - `redeem_wallet IS NOT NULL`
3. Strict claimed condition (optional):
   - `redeem_wallet IS NOT NULL` AND `redeem_tx IS NOT NULL`

## Data/Logic Rules

1. **Normalization**
   - Input code: trim spaces, uppercase.
   - Wallet comparisons: lowercase for joins, preserve original for display.
2. **Claim time**
   - Use `updated_at` as `claimedAt` for MVP.
   - Optional future improvement: add explicit `redeemed_at` field.
3. **Redeemed state**
   - Do not rely only on `isAvailable`.
   - Preferred signal: `redeem_wallet` present.
4. **Error handling**
   - 400 for invalid code format
   - 404 for unknown code
   - 200 with `isRedeemed=false` when code exists but not redeemed
5. **Security**
   - Admin-only endpoint access (existing admin auth pattern)
   - Rate limit to avoid enumeration abuse

## Suggested Validation

- Allowed code regex: `^[A-Z0-9]{6,16}$` (adjust based on generator)
- Reject empty, whitespace-only, or over-length input.

## Performance and Indexing

For fast lookup at scale:

1. Add index on claim code:

```sql
CREATE INDEX IF NOT EXISTS idx_freepacks_code ON "freePacks"(code);
```

2. If case-insensitive lookup is frequent:

```sql
CREATE INDEX IF NOT EXISTS idx_freepacks_upper_code ON "freePacks"(UPPER(code));
```

## Implementation Steps

1. **Create service layer function**
   - `getClaimByCode(code)`
   - `getClaimCodeProfile(code)`
2. **Implement API routes**
   - `GET /api/claim-codes/:code`
   - `GET /api/claim-codes/:code/profile`
3. **Map Supabase row -> response DTO**
   - Normalize field names to camelCase in API response.
4. **Integrate wallet profile aggregation**
   - Reuse existing wallet purchase/profile endpoints.
5. **Add tests**
   - unit: input normalization, status logic
   - integration: found/redeemed/not-redeemed/not-found paths
6. **Deploy and verify with known code**
   - `NVSSE9GZ` should resolve to expected wallet and tx

## Test Cases

1. Valid redeemed code -> returns wallet + tx + claimedAt.
2. Valid unredeemed code -> `isRedeemed=false`.
3. Unknown code -> 404 with `exists=false`.
4. Lowercase input (`nvsse9gz`) -> still resolves.
5. Leading/trailing spaces -> still resolves after trim.
6. Invalid symbols -> 400.
7. Profile endpoint returns combined payload without breaking if wallet profile source is unavailable.

## Rollout Plan

1. Ship lookup endpoint first (`/api/claim-codes/:code`).
2. Validate data quality on dashboard with internal users.
3. Ship profile endpoint and retention fields.
4. Add campaign-level analytics endpoints (optional).

## Future Enhancements

- Add bulk endpoint:
  - `POST /api/claim-codes/batch-lookup`
- Add campaign attribution:
  - `campaign_id`, `source_channel`, `utm`
- Add explicit `redeemed_at` column to avoid inferred claim time.
- Add export endpoint for BI/ops:
  - CSV by code/date range.
