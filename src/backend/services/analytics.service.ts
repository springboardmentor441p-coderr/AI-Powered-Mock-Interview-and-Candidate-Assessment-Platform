import { AnalyticsSummary } from '../../types';

export interface IAnalyticsService {
  getCandidateAnalytics(candidateId?: string): Promise<AnalyticsSummary>;
}

export class AnalyticsServicePlaceholder implements IAnalyticsService {
  async getCandidateAnalytics(_candidateId?: string): Promise<AnalyticsSummary> {
    return {
      totalInterviews: 14,
      averageScore: 87,
      totalPracticeTimeMinutes: 340,
      readinessLevel: 'Job Ready',
      radarMetrics: [
        { metric: 'Technical Depth', score: 90 },
        { metric: 'Communication', score: 88 },
        { metric: 'Problem Solving', score: 86 },
        { metric: 'Behavioral Fit', score: 92 },
        { metric: 'Code Quality', score: 85 },
        { metric: 'Speed & Time', score: 89 },
      ],
      recentPerformance: [
        { date: 'Jul 15', score: 72, category: 'Technical' },
        { date: 'Jul 20', score: 78, category: 'Behavioral' },
        { date: 'Jul 25', score: 82, category: 'HR' },
        { date: 'Jul 30', score: 85, category: 'Technical' },
        { date: 'Aug 02', score: 92, category: 'Behavioral' },
        { date: 'Aug 05', score: 88, category: 'Technical' },
      ],
      categoryBreakdown: [
        { type: 'Technical', count: 7, avgScore: 86 },
        { type: 'Behavioral', count: 4, avgScore: 91 },
        { type: 'HR', count: 2, avgScore: 85 },
        { type: 'Aptitude', count: 1, avgScore: 80 },
      ]
    };
  }
}

export const analyticsService = new AnalyticsServicePlaceholder();
