/**
 * Seed script: Archetype overrides from known wallet lists.
 *
 * Usage:
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... node scripts/seed-archetypes.js
 *
 * Requires @supabase/supabase-js installed (already in project deps).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SEED_DATA = [
  {
    archetype: 'binge-and-gone',
    wallets: [
      '0x8889bda9bdc679eabc338881c36b09300af574af',
      '0x96eb386c3fbe85f01a7279cd5b7b810575ee2079',
      '0x5c1c2ff9a56b81f4bcfb83d2622de93fd3a8c68a',
      '0x4ab950fbccabb9d13fb0409f717a2ad016049c71',
      '0x8de51f59b5b1c47791fa512c0509ca4c6561e10e',
    ],
  },
  {
    archetype: 'binge-episodes',
    wallets: [
      '0xfaa7a48beaa9e1787eb7be72b92fbb2af0ad1a2b',
      '0x763e935a600c4ad5064fa8b29f5f5a6e9431a08e',
      '0x51bc312c9d82ce1d1e49f423ebe3ba076ecfd0d9',
      '0x44dad79ceefd8a0a26bc137646917fd172c619f9',
      '0xb747190b7394ed19dca4aa4ba7f4bea90790f8dc',
      '0x78bb8a1f182b2e12273b00abeb7456838f144f23',
      '0x55f24f8658452700c24880438cedebeaff078970',
    ],
  },
  {
    archetype: 'steady-periodic',
    wallets: [
      '0x0306ace269ce1dd685e3d597e6fb53d14b0f1d26',
      '0x5ca6c4f024188e7d341905e10bf45246e0234008',
      '0xbb2accb64aed939589498bf5eb480e52a314f572',
      '0x19efa122947d681e0ca943340f6f7d3404dee969',
      '0xc9f27e68912aae40bb60c17b5634b3e74bbb16ab',
      '0x9ba83127b00fe7834f9b4d4fff79628d875b80e2',
      '0xa101269ac787f08e7162b84cf5e990b21d4c57be',
      '0x2293b9e29934fc0de1e48913ee1547ba25ceb355',
    ],
  },
];

async function seed() {
  let total = 0;
  let errors = 0;

  for (const group of SEED_DATA) {
    for (const wallet of group.wallets) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert(
            {
              wallet_address: wallet,
              archetype: group.archetype,
              archetype_override: true,
              archetype_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'wallet_address' }
          );

        if (error) {
          console.error(`Failed: ${wallet} → ${group.archetype}:`, error.message);
          errors++;
        } else {
          console.log(`Seeded: ${wallet} → ${group.archetype}`);
          total++;
        }
      } catch (err) {
        console.error(`Error: ${wallet}:`, err.message);
        errors++;
      }
    }
  }

  console.log(`\nDone. ${total} seeded, ${errors} errors.`);
}

seed();
