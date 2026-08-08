import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    const result = await authService.login(email);
    return res.json({ status: 'success', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
};

export const signupHandler = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await authService.signup(data);
    return res.json({ status: 'success', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Signup failed' });
  }
};

export const profileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'usr_candidate_01';
    const profile = await authService.getProfile(userId);
    return res.json({ status: 'success', data: profile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch profile' });
  }
};
