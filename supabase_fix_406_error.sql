-- Fix for 406 Not Acceptable error on user_profiles table
-- This error is usually caused by RLS policy issues or missing policies

-- First, check if RLS is enabled and policies exist
-- If you're getting 406 errors, run these commands:

-- 1. Ensure the policy exists and is correct
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- 2. Create a more explicit policy that works with PostgREST
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. Alternative: If the above doesn't work, try disabling RLS temporarily to test
-- (Only for testing - re-enable after confirming the table works)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. If you disabled RLS for testing, re-enable it:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verify the policy is working:
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Note: The 406 error can also occur if:
-- - The table doesn't exist (check with: SELECT * FROM user_profiles LIMIT 1;)
-- - There's a schema mismatch
-- - The Supabase client isn't properly configured
