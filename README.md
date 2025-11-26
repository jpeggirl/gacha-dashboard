# Gacha Admin Dashboard

A production-ready React dashboard for analyzing gacha game wallet purchases and player behavior.

## Features

- 🔐 Multi-user password-protected admin access (Admin, Tania, Chase, Kush, Denx, Angela)
- 👤 User identification - comments show which user added them
- 🏠 Homepage with live feed of all profile comments
- 🔍 Wallet address search and analysis
- 📊 Real-time analytics and visualizations
- 📈 Spending trends and breakdown charts
- 💳 Transaction history tracking
- 💬 Profile comments for each wallet
- 🎯 User tier classification (Free to Play, Minnow, Dolphin, Whale, Leviathan)
- ⏱️ Time frame filters (7 days, 30 days, all time)
- 🔄 Automatic fallback to mock data when API is unavailable
- 🔔 Real-time updates via Supabase

## Project Structure

```
gacha dashboard/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Header.jsx
│   │   ├── KPICard.jsx
│   │   ├── UserProfile.jsx
│   │   ├── SpendingMixChart.jsx
│   │   ├── ActivityChart.jsx
│   │   ├── TransactionTable.jsx
│   │   ├── LoadingOverlay.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── MockDataBanner.jsx
│   │   └── EmptyState.jsx
│   ├── config/              # Configuration files
│   │   └── constants.js
│   ├── services/            # API services
│   │   └── api.js
│   ├── utils/               # Utility functions
│   │   ├── mockData.js
│   │   └── analytics.js
│   ├── types/               # Type definitions
│   │   └── index.js
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```bash
# API Configuration
VITE_ADMIN_PASSWORD="your-api-password-here"

# User Login Passwords (optional - defaults provided)
VITE_USER_ADMIN_PASSWORD="admin123"
VITE_USER_TANIA_PASSWORD="tania123"
VITE_USER_CHASE_PASSWORD="chase123"
VITE_USER_KUSH_PASSWORD="kush123"
VITE_USER_DENX_PASSWORD="denx123"
VITE_USER_ANGELA_PASSWORD="angela123"

# Supabase Configuration
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

**Note:** If you don't set the user passwords in `.env`, default passwords will be used (e.g., `tania123`, `chase123`, etc.). For production, you should set strong, unique passwords for each user.

Example `.env` file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Configuration

### API Configuration

Edit `src/config/constants.js` to modify:
- API base URL
- Endpoints
- Request timeout
- Admin password (or use environment variable)

### Environment Variables

The `.env` file supports the following variables:

- **VITE_ADMIN_PASSWORD**: Password for API requests (required)
- **VITE_USER_TANIA_PASSWORD**: Login password for Tania (default: `tania123`)
- **VITE_USER_CHASE_PASSWORD**: Login password for Chase (default: `chase123`)
- **VITE_USER_KUSH_PASSWORD**: Login password for Kush (default: `kush123`)
- **VITE_USER_DENX_PASSWORD**: Login password for Denx (default: `denx123`)
- **VITE_USER_ANGELA_PASSWORD**: Login password for Angela (default: `angela123`)
- **VITE_USER_ADMIN_PASSWORD**: Login password for the shared Admin account (default: `admin123`)
- **VITE_SUPABASE_URL**: Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key

### Security

The dashboard supports multiple users with individual passwords:
- **Admin**, **Tania**, **Chase**, **Kush**, **Denx**, and **Angela** each have their own login password
- Default passwords are provided for development (e.g., `tania123`, `chase123`, etc.)
- To set custom passwords, add them to your `.env` file
- When users add comments to profiles, their name is automatically recorded and displayed
- The current logged-in user's name is shown in the header

**Important:** For production, always set strong, unique passwords for each user via environment variables. Never commit passwords to version control.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Key Components

- **App.jsx**: Main application component that orchestrates all features
- **Header**: Search bar and navigation
- **KPICard**: Displays key performance indicators
- **UserProfile**: Shows user tier and wallet information
- **SpendingMixChart**: Pie chart showing spending distribution
- **ActivityChart**: Bar chart showing spending over time
- **TransactionTable**: Detailed transaction history

## API Integration

The dashboard connects to:
```
https://api-pull.gacha.game/api/admin/pack-purchases/{walletAddress}
```

If the API is unavailable, the app automatically falls back to mock data for demonstration purposes.

## Technologies Used

- React 18
- Vite
- Tailwind CSS (via CDN)
- Recharts
- Lucide React (icons)

## License

Private - All rights reserved

