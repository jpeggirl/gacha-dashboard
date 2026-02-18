# Abstract Tagger

Automated tagging agent for Abstract Portal users. This tool monitors untagged users from the leaderboard, searches them on abs.xyz, and automatically tags them based on their tier status.

## How it Works

1. Fetches users from the leaderboard API
2. Checks Supabase for users without tags
3. For each untagged user:
   - Searches their wallet address on portal.abs.xyz
   - Checks if they have a "Gold Tier" badge
   - Tags them accordingly:
     - **Gold tier found** → `abstract farmer`
     - **Not found or no gold** → `outside user`

## Setup

### 1. Install Dependencies

```bash
cd scripts/abstract-tagger
npm install
npx playwright install chromium
```

### 2. First-Time Login

The bot needs to be logged in to abs.xyz. Run setup mode to open a browser and log in manually:

```bash
npm run setup
```

This will:
- Open a Chrome browser window
- Navigate to portal.abs.xyz
- Wait for you to log in with dev@sosleek.io
- Save the session for future automated runs

### 3. Run the Daemon

Once logged in, start the background daemon:

```bash
npm run daemon
```

The daemon will:
- Run the tagging job immediately on start
- Re-run every hour (configurable via `TAGGER_CRON_SCHEDULE` env var)

### Running Once (Testing)

To test the workflow without starting the daemon:

```bash
node index.js --once
```

## Environment Variables

The script uses the same `.env` file as the main dashboard:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_ADMIN_PASSWORD` | Admin password for leaderboard API |
| `TAGGER_CRON_SCHEDULE` | Cron schedule (default: `0 * * * *` - every hour) |

## Production Deployment

For production use, consider using PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the daemon
pm2 start index.js --name abstract-tagger -- --daemon

# View logs
pm2 logs abstract-tagger

# Stop
pm2 stop abstract-tagger
```

## Files

- `index.js` - Main orchestration script with scheduler
- `browser.js` - Playwright browser automation for abs.xyz
- `.browser-data/` - Saved browser session (gitignored)

## Troubleshooting

### "Not logged in" error
Run `npm run setup` again to re-authenticate.

### Rate limiting
The script waits 2 seconds between each wallet search. If you're getting blocked, increase the delay in `index.js`.

### Browser not opening
Make sure Playwright's Chromium is installed:
```bash
npx playwright install chromium
```
