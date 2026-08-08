import { Router } from 'express';
import { parseResumeHandler, getResumeAnalysisHandler } from '../controllers/resume.controller';

const router = Router();

router.post('/parse', parseResumeHandler);
router.get('/analysis', getResumeAnalysisHandler);

export default router;
