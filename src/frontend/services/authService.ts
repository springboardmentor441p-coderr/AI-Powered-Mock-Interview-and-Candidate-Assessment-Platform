import { User } from '../../types';

export interface StoredUserRecord extends User {
  passwordHash: string; // Plaintext/mock hash for local dev auth
}

const USERS_STORAGE_KEY = 'smarthire_users';
const SESSION_STORAGE_KEY = 'smarthire_session';

const DEFAULT_DEMO_USER: StoredUserRecord = {
  id: 'usr_candidate_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  passwordHash: 'password123',
  role: 'candidate',
  targetRole: 'Senior Full Stack Engineer',
  experienceLevel: 'Senior',
  skills: ['React', 'TypeScript', 'Node.js', 'System Design', 'Express', 'Tailwind CSS'],
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  createdAt: new Date().toISOString(),
};

// Initialize users registry if empty
function getUsersRegistry(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_DEMO_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_DEMO_USER];
  }
}

function saveUsersRegistry(users: StoredUserRecord[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulate brief network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsersRegistry();

    const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      throw new Error('No account found with this email address. Please check or sign up.');
    }

    if (foundUser.passwordHash !== password) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // Omit passwordHash from session object
    const { passwordHash, ...userSession } = foundUser;

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));

    return {
      user: userSession,
      token: `dev_token_${Date.now()}_${userSession.id}`,
    };
  },

  /**
   * Register a new candidate user
   */
  async signup(data: {
    name: string;
    email: string;
    password: string;
    targetRole?: string;
    experienceLevel?: 'Junior' | 'Mid' | 'Senior' | 'Lead';
    skills?: string[];
  }): Promise<{ user: User; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalizedEmail = data.email.trim().toLowerCase();
    const users = getUsersRegistry();

    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newRecord: StoredUserRecord = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash: data.password,
      role: 'candidate',
      targetRole: data.targetRole || 'Full Stack Engineer',
      experienceLevel: data.experienceLevel || 'Mid',
      skills: data.skills || ['React', 'TypeScript', 'Node.js'],
      createdAt: new Date().toISOString(),
    };

    users.push(newRecord);
    saveUsersRegistry(users);

    const { passwordHash, ...userSession } = newRecord;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));

    return {
      user: userSession,
      token: `dev_token_${Date.now()}_${userSession.id}`,
    };
  },

  /**
   * Fetch current active session user
   */
  getCurrentUser(): User | null {
    try {
      const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionRaw) {
        return JSON.parse(sessionRaw);
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Clear local auth session
   */
  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Update active user profile
   */
  updateProfile(updated: Partial<User>): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const mergedUser: User = { ...current, ...updated };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mergedUser));

    // Also update in users registry
    const users = getUsersRegistry();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      saveUsersRegistry(users);
    }

    return mergedUser;
  },
};
