import { User } from '../../types';

export interface IAuthService {
  login(email: string, password?: string): Promise<{ user: User; token: string }>;
  signup(data: Partial<User> & { password?: string }): Promise<{ user: User; token: string }>;
  getProfile(userId: string): Promise<User | null>;
}

export class AuthServicePlaceholder implements IAuthService {
  private mockUsers: User[] = [
    {
      id: 'usr_candidate_01',
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      role: 'candidate',
      targetRole: 'Senior Full Stack Engineer',
      experienceLevel: 'Senior',
      skills: ['React', 'TypeScript', 'Node.js', 'System Design', 'Express', 'GraphQL'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date().toISOString(),
    }
  ];

  async login(email: string): Promise<{ user: User; token: string }> {
    const existing = this.mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const user = existing || {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' '),
      email,
      role: 'candidate',
      targetRole: 'Full Stack Software Engineer',
      experienceLevel: 'Mid',
      skills: ['React', 'TypeScript', 'Node.js'],
      createdAt: new Date().toISOString(),
    };

    return {
      user,
      token: `smarthire_mock_jwt_token_${user.id}_${Date.now()}`,
    };
  }

  async signup(data: Partial<User>): Promise<{ user: User; token: string }> {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name || 'New Candidate',
      email: data.email || 'candidate@example.com',
      role: data.role || 'candidate',
      targetRole: data.targetRole || 'Software Engineer',
      experienceLevel: data.experienceLevel || 'Mid',
      skills: data.skills || ['JavaScript', 'Problem Solving'],
      createdAt: new Date().toISOString(),
    };

    this.mockUsers.push(newUser);

    return {
      user: newUser,
      token: `smarthire_mock_jwt_token_${newUser.id}_${Date.now()}`,
    };
  }

  async getProfile(userId: string): Promise<User | null> {
    const user = this.mockUsers.find(u => u.id === userId);
    return user || this.mockUsers[0];
  }
}

export const authService = new AuthServicePlaceholder();
