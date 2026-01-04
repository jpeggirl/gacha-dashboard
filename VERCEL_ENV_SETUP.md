# Vercel Environment Variables Setup

## Critical: Production Environment Variables

Your production deployment is failing because environment variables are not configured in Vercel. Follow these steps to fix it:

## Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`gachapullcs` or your project name)
3. Click on **Settings** in the top navigation
4. Click on **Environment Variables** in the left sidebar

## Step 2: Add Required Environment Variables

Add the following environment variables. Make sure to select **Production**, **Preview**, and **Development** environments for each:

### API Configuration (REQUIRED)
```
VITE_ADMIN_PASSWORD=your-api-admin-password-here
```
**This is critical** - Without this, API calls will fail with 403 Forbidden errors.

### Supabase Configuration (REQUIRED for tags and comments)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```
**This is required** - Without this, user tags, profile comments, and announcements won't work.

### User Login Passwords (Optional - defaults will be used if not set)
```
VITE_USER_ADMIN_PASSWORD=admin123
VITE_USER_TANIA_PASSWORD=tania123
VITE_USER_CHASE_PASSWORD=chase123
VITE_USER_KUSH_PASSWORD=kush123
VITE_USER_DENX_PASSWORD=denx123
VITE_USER_ANGELA_PASSWORD=angela123
```

## Step 3: Redeploy

After adding all environment variables:

1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeployment

## Step 4: Verify

After redeployment, check:
- ✅ API calls should work (no more 403 errors)
- ✅ Supabase warnings should disappear
- ✅ User tags should load and save
- ✅ Profile comments should work
- ✅ Leaderboard should show real data

## Finding Your Values

### API Password
- Check with your backend team or API documentation
- This is the password used for `x-admin-password` header

### Supabase Credentials
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### Still seeing 403 errors?
- Verify `VITE_ADMIN_PASSWORD` is set correctly
- Check that the password matches what your API expects
- Ensure you selected **Production** environment when adding the variable

### Still seeing Supabase warnings?
- Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Make sure you didn't include quotes around the values
- Check that you selected **Production** environment
- Redeploy after adding variables

### Variables not taking effect?
- **You must redeploy** after adding/changing environment variables
- Environment variables are baked into the build at build time
- Simply saving variables won't update running deployments

## Quick Checklist

- [ ] Added `VITE_ADMIN_PASSWORD` to Production environment
- [ ] Added `VITE_SUPABASE_URL` to Production environment  
- [ ] Added `VITE_SUPABASE_ANON_KEY` to Production environment
- [ ] Selected Production, Preview, and Development for each variable
- [ ] Redeployed the application
- [ ] Verified no more console errors
- [ ] Tested API calls work
- [ ] Tested user tags functionality
