# Deployment Guide

## GitHub Setup

### Option 1: Using GitHub CLI (if installed)
```bash
gh repo create gacha-dashboard --public --source=. --remote=origin --push
```

### Option 2: Manual Setup
1. Go to [GitHub](https://github.com/new) and create a new repository
2. Name it `gacha-dashboard` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)
4. Run these commands:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/gacha-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Vercel Deployment

### Option 1: Using Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### Option 2: Using Vercel Dashboard
1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository (`gacha-dashboard`)
4. Vercel will auto-detect Vite settings
5. **Important**: Add these environment variables in Vercel dashboard:
   - `VITE_ADMIN_PASSWORD` - Your API admin password
   - `VITE_USER_ADMIN_PASSWORD` - Shared admin login password
   - `VITE_USER_TANIA_PASSWORD` - Tania's login password
   - `VITE_USER_CHASE_PASSWORD` - Chase's login password
   - `VITE_USER_KUSH_PASSWORD` - Kush's login password
   - `VITE_USER_DENX_PASSWORD` - Denx's login password
   - `VITE_USER_ANGELA_PASSWORD` - Angela's login password
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
6. Click "Deploy"

## Environment Variables Setup

Make sure to add all environment variables in Vercel:
- Project Settings → Environment Variables
- Add each variable for Production, Preview, and Development environments

## Post-Deployment

After deployment, your app will be available at:
- `https://your-project-name.vercel.app`

Make sure to:
1. Test the login with different user accounts
2. Verify API connections are working
3. Check that Supabase connections are functioning
4. Test the leaderboard endpoints

