import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, findUserByEmail, UserRecord } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token is required to access this resource.'
    });
    return;
  }

  try {
    const decoded = verifyJwtToken(token);
    const user = findUserByEmail(decoded.email);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authenticated user account no longer exists.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: err?.message || 'Invalid or expired session token.'
    });
  }
}
