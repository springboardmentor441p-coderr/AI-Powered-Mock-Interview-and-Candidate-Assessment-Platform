import { Request, Response } from 'express';
import { interviewService } from '../services/interview.service';

export const setupInterviewHandler = async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const questions = await interviewService.generateQuestionSet(config);
    return res.json({ status: 'success', data: { config, questions } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to setup interview questions' });
  }
};

export const nextQuestionHandler = async (req: Request, res: Response) => {
  try {
    const params = req.body;
    const question = await interviewService.generateNextQuestion(params);
    return res.json({ status: 'success', data: question });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate next interview question' });
  }
};

export const submitInterviewHandler = async (req: Request, res: Response) => {
  try {
    const { config, answers, sessionQuestions, speechData } = req.body;
    const assessment = await interviewService.submitFullInterview(config, answers, sessionQuestions, speechData);
    return res.json({ status: 'success', data: assessment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process interview evaluation' });
  }
};

export const getHistoryHandler = async (_req: Request, res: Response) => {
  try {
    const history = await interviewService.getHistory();
    return res.json({ status: 'success', data: history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch interview history' });
  }
};

export const getResultByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await interviewService.getResultById(id);
    return res.json({ status: 'success', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch interview result' });
  }
};
