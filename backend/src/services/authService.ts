import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'intervio_enterprise_jwt_secret_key_2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'candidate' | 'recruiter' | 'admin';
  companyName?: string;
  targetRole?: string;
  experienceLevel?: string;
  completedInterviewsCount: number;
  averageScore: number;
  readinessLevel: string;
  avatar: string;
  createdAt: string;
}

// In-Memory User Database Seeded with Initial Accounts
const usersDatabase: Map<string, UserRecord> = new Map();

// Seed initial system users
const seedUsers: UserRecord[] = [
  {
    id: 'usr-101',
    name: 'Alex Chen',
    email: 'alex.chen@devmail.io',
    passwordHash: hashPassword('password123'),
    role: 'candidate',
    companyName: 'TechCorp Solutions',
    targetRole: 'Senior Full Stack Engineer',
    experienceLevel: '3-5 Years',
    completedInterviewsCount: 1,
    averageScore: 89,
    readinessLevel: 'Senior Engineer Ready',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-demo-candidate',
    name: 'Candidate User',
    email: 'candidate@intervio.ai',
    passwordHash: hashPassword('candidate123'),
    role: 'candidate',
    companyName: 'Personal Candidate Profile',
    targetRole: 'Software Engineer',
    experienceLevel: '3-5 Years',
    completedInterviewsCount: 0,
    averageScore: 0,
    readinessLevel: 'Active Profile',
    avatar: 'https://ui-avatars.com/api/?name=Candidate+User&background=059669&color=fff',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-recruiter-88',
    name: 'Sarah Jenkins',
    email: 'recruiter@enterprise-hiring.com',
    passwordHash: hashPassword('recruiter123'),
    role: 'recruiter',
    companyName: 'Apex Enterprise Technologies',
    targetRole: 'Head of Global Talent Acquisition',
    experienceLevel: 'Senior',
    completedInterviewsCount: 240,
    averageScore: 91,
    readinessLevel: 'Hiring Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-admin-1',
    name: 'Platform Administrator',
    email: 'admin@intervio.ai',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    companyName: 'InterVio Platform System',
    targetRole: 'System Administrator',
    experienceLevel: 'Executive',
    completedInterviewsCount: 0,
    averageScore: 100,
    readinessLevel: 'System Admin',
    avatar: 'https://ui-avatars.com/api/?name=Platform+Administrator&background=0f172a&color=fff',
    createdAt: new Date().toISOString()
  }
];

// Initialize map with seed users
seedUsers.forEach(u => usersDatabase.set(u.email.toLowerCase(), u));

export function findUserByEmail(email: string): UserRecord | undefined {
  return usersDatabase.get(email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  for (const user of usersDatabase.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function registerUser(
  name: string,
  email: string,
  password?: string,
  role: 'candidate' | 'recruiter' | 'admin' = 'candidate'
): { user: UserRecord; token: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (usersDatabase.has(normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const formattedName = name.trim() || normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: formattedName,
    email: normalizedEmail,
    passwordHash: hashPassword(password || 'password123'),
    role,
    companyName: role === 'recruiter' ? 'Enterprise Technologies' : 'Personal Candidate Profile',
    targetRole: role === 'recruiter' ? 'Talent Acquisition Manager' : 'Software Engineer',
    experienceLevel: '3-5 Years',
    completedInterviewsCount: 0,
    averageScore: 0,
    readinessLevel: 'Active Profile',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=059669&color=fff`,
    createdAt: new Date().toISOString()
  };

  usersDatabase.set(normalizedEmail, newUser);

  const token = generateJwtToken(newUser);
  return { user: newUser, token };
}

export function loginUser(
  email: string,
  password?: string,
  role?: 'candidate' | 'recruiter' | 'admin',
  name?: string
): { user: UserRecord; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  let user = usersDatabase.get(normalizedEmail);

  // If user account doesn't exist, auto-register
  if (!user) {
    return registerUser(name || '', normalizedEmail, password || 'password123', role || 'candidate');
  }

  // Validate password if provided and not matching seed defaults
  if (password && hashPassword(password) !== user.passwordHash) {
    const isSeed = seedUsers.some(s => s.email.toLowerCase() === normalizedEmail);
    if (!isSeed) {
      throw new Error('Incorrect email or password.');
    }
  }

  let needsUpdate = false;
  let nextUser = user;

  if (role && user.role !== role) {
    nextUser = { ...user, role };
    needsUpdate = true;
  }
  if (name && name.trim() && user.name !== name.trim()) {
    nextUser = { ...nextUser, name: name.trim() };
    needsUpdate = true;
  }
  if (needsUpdate) {
    usersDatabase.set(normalizedEmail, nextUser);
  }

  const token = generateJwtToken(nextUser);
  return { user: nextUser, token };
}

export function generateJwtToken(user: UserRecord): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): { sub: string; email: string; name: string; role: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
}

export function updateUserProfile(id: string, updates: Partial<UserRecord>): UserRecord {
  const user = findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = { ...user, ...updates };
  usersDatabase.set(updatedUser.email.toLowerCase(), updatedUser);
  return updatedUser;
}
