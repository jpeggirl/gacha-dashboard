-- Migration: Create user_profiles table for tag system
-- This table stores user profile data including tags
-- The existing profile_comments table remains unchanged

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  tags TEXT[] DEFAULT '{}', -- Array of tags for this user
  twitter_username TEXT, -- Optional: store Twitter username if needed
  notes TEXT, -- Optional: additional notes about the user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'Admin'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tags ON user_profiles USING GIN(tags); -- GIN index for array searches

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Note: The profile_comments table remains completely unchanged
-- All existing comments will be preserved
