import { Request, Response } from 'express';
import { resumeService } from '../services/resume.service';

export const parseResumeHandler = async (req: Request, res: Response) => {
  try {
    const { fileName, targetJobRole } = req.body;
    const result = await resumeService.parseResume(fileName || 'Candidate_Resume.pdf', undefined, targetJobRole);
    return res.json({ status: 'success', data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
};

export const getResumeAnalysisHandler = async (_req: Request, res: Response) => {
  try {
    const analysis = await resumeService.getLatestAnalysis();
    return res.json({ status: 'success', data: analysis });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch resume analysis' });
  }
};
