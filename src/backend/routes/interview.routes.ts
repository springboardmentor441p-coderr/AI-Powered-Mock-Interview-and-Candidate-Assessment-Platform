import { Router } from 'express';
import {
  setupInterviewHandler,
  nextQuestionHandler,
  submitInterviewHandler,
  getHistoryHandler,
  getResultByIdHandler,
} from '../controllers/interview.controller';

const router = Router();

router.post('/setup', setupInterviewHandler);
router.post('/next-question', nextQuestionHandler);
router.post('/submit', submitInterviewHandler);
router.get('/history', getHistoryHandler);
router.get('/result/:id', getResultByIdHandler);

export default router;
