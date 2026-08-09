import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fetch interviews list endpoint
router.get('/interviews', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Fetch interviews list endpoint',
    data: []
  });
});

// Start interview endpoint
router.post('/interview/start', (req: Request, res: Response) => {
  const { role, difficulty } = req.body;
  res.json({
    success: true,
    message: `Started interview for ${role || 'Software Engineer'} (${difficulty || 'Medium'})`,
    sessionId: `session_${Date.now()}`
  });
});

// Complete interview session endpoint
router.post('/interview/complete', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  res.json({
    success: true,
    message: `Interview session ${sessionId || ''} marked as completed`,
    timestamp: new Date().toISOString()
  });
});

// Reset interview session endpoint
router.post('/interview/reset', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Interview session state cleared & reset successfully',
    timestamp: new Date().toISOString()
  });
});

export default router;
