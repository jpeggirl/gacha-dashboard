# Supabase Setup Guide

This guide will help you set up Supabase for the Gacha Admin Dashboard to store announcements and profile comments.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note your project URL and anon key from Settings > API

## 2. Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor:

### Announcements Table
```sql
CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  author TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, adjust as needed)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust policies based on your security needs)
CREATE POLICY "Allow all operations on announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);
```

### Profile Comments Table
```sql
CREATE TABLE profile_comments (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  comment TEXT NOT NULL,
  author TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_profile_comments_wallet ON profile_comments(wallet_address);

-- Enable Row Level Security (optional, adjust as needed)
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust policies based on your security needs)
CREATE POLICY "Allow all operations on profile_comments" ON profile_comments
  FOR ALL USING (true) WITH CHECK (true);
```

## 3. Enable Real-time (Optional but Recommended)

1. Go to Database > Replication in your Supabase dashboard
2. Enable replication for both `announcements` and `profile_comments` tables
3. This enables real-time updates without page refresh

## 4. Configure Environment Variables

Add these to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Test the Connection

After setting up, restart your development server:

```bash
npm run dev
```

The announcements feed and profile comments should now work with your Supabase database!

## Security Notes

- The default policies allow all operations. For production, you should:
  - Restrict INSERT/UPDATE/DELETE to authenticated users only
  - Add proper authentication with Supabase Auth
  - Implement role-based access control
  - Review and tighten RLS policies based on your needs

