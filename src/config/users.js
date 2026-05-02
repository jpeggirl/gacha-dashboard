// User credentials configuration
// In production, these should be stored securely (e.g., environment variables or a secure backend)

export const USERS = {
  admin: {
    name: 'Admin',
    password: import.meta.env.VITE_USER_ADMIN_PASSWORD || 'admin123'
  },
  tania: {
    name: 'Tania',
    password: import.meta.env.VITE_USER_TANIA_PASSWORD || 'tania123'
  },
  chase: {
    name: 'Chase',
    password: import.meta.env.VITE_USER_CHASE_PASSWORD || 'chase123'
  },
  kush: {
    name: 'Kush',
    password: import.meta.env.VITE_USER_KUSH_PASSWORD || 'kush123'
  },
  denx: {
    name: 'Denx',
    password: import.meta.env.VITE_USER_DENX_PASSWORD || 'denx123'
  },
  angela: {
    name: 'Angela',
    password: import.meta.env.VITE_USER_ANGELA_PASSWORD || 'angela123'
  }
};

// Helper function to authenticate user
export const authenticateUser = (password) => {
  for (const [username, user] of Object.entries(USERS)) {
    if (password === user.password) {
      return { username, name: user.name };
    }
  }
  return null;
};

// Get current logged-in user
export const getCurrentUser = () => {
  const username = sessionStorage.getItem('current_username');
  if (username && USERS[username]) {
    return { username, name: USERS[username].name };
  }
  return null;
};

