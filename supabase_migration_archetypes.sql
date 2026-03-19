-- Migration: Add archetype columns to user_profiles
-- Run this after supabase_migration_user_profiles.sql

-- Add archetype classification columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS archetype TEXT DEFAULT 'unclassified',
  ADD COLUMN IF NOT EXISTS archetype_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS archetype_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archetype_metrics JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS archetype_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Add indexes for filtering by archetype and status
CREATE INDEX IF NOT EXISTS idx_user_profiles_archetype ON user_profiles (archetype);
CREATE INDEX IF NOT EXISTS idx_user_profiles_archetype_status ON user_profiles (archetype_status);

-- Add CHECK constraints for valid values
ALTER TABLE user_profiles
  ADD CONSTRAINT chk_archetype_value
    CHECK (archetype IN ('binge-and-gone', 'binge-episodes', 'steady-periodic', 'unclassified'));

ALTER TABLE user_profiles
  ADD CONSTRAINT chk_archetype_status_value
    CHECK (archetype_status IS NULL OR archetype_status IN ('active', 'slipping', 'churned'));
