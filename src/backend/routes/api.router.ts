import { Router } from 'express';
import authRoutes from './auth.routes';
import interviewRoutes from './interview.routes';
import resumeRoutes from './resume.routes';
import analyticsRoutes from './analytics.routes';
import { databaseService } from '../services/database.interface';

const apiRouter = Router();

// Health & Database Status Check Endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'SmartHire AI Platform API',
    timestamp: new Date().toISOString(),
    database: databaseService.getStatus(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/interview', interviewRoutes);
apiRouter.use('/resume', resumeRoutes);
apiRouter.use('/analytics', analyticsRoutes);

export default apiRouter;
