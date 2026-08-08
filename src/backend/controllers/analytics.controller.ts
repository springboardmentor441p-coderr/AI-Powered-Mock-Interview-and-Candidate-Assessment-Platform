import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const getAnalyticsHandler = async (_req: Request, res: Response) => {
  try {
    const summary = await analyticsService.getCandidateAnalytics();
    return res.json({ status: 'success', data: summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
};
