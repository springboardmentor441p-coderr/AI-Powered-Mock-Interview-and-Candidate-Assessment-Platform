import { ResumeAnalysis } from '../../types';

export interface IResumeService {
  parseResume(fileName: string, fileBufferContent?: string, targetJobRole?: string): Promise<ResumeAnalysis>;
  getLatestAnalysis(): Promise<ResumeAnalysis | null>;
}

export class ResumeServicePlaceholder implements IResumeService {
  private lastAnalysis: ResumeAnalysis | null = {
    fileName: 'Alex_Morgan_Senior_Engineer_Resume.pdf',
    fileSize: '142 KB',
    uploadedAt: new Date().toISOString(),
    status: 'Successfully analyzed',
    statusMessage: 'Resume analyzed successfully',
    parsedName: 'Alex Morgan',
    parsedEmail: 'alex.morgan@example.com',
    parsedPhone: '+1 (555) 019-2834',
    parsedSkills: [
      'React', 'TypeScript', 'Node.js', 'Express', 'GraphQL',
      'System Design', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS', 'Jest'
    ],
    education: ['B.S. in Computer Science - Stanford University (2016 - 2020)'],
    experience: ['Senior Full Stack Engineer - TechCorp (2021 - Present)', 'Software Engineer - CloudSystems (2020 - 2021)'],
    projects: ['SmartHire AI - AI-driven Mock Interview & ATS Candidate Evaluation System'],
    certifications: ['AWS Certified Solutions Architect - Associate'],
    detectedRole: 'Senior Full Stack Engineer',
    matchScore: 89,
    formattingScore: 94,
    keyHighlights: [
      'Led migration of monolithic frontend to micro-frontends serving 200k daily active users',
      'Architected high-throughput REST & GraphQL APIs with Node.js and TypeScript',
      'Engineered automated CI/CD pipelines reducing deployment friction by 40%'
    ],
    missingKeywords: [
      'Kubernetes', 'Redis Caching', 'CI/CD Pipeline Security', 'Performance Benchmarking'
    ],
    improvementSuggestions: [
      'Quantify the performance impact of GraphQL caching in the work experience section.',
      'Add a dedicated System Design & Cloud Infrastructure bullet point near top skills.',
      'Highlight testing coverage metrics (e.g. 85%+ Jest/Playwright coverage).'
    ]
  };

  async parseResume(fileName: string, _content?: string, targetJobRole?: string): Promise<ResumeAnalysis> {
    const analysis: ResumeAnalysis = {
      fileName,
      fileSize: '128 KB',
      uploadedAt: new Date().toISOString(),
      status: 'Successfully analyzed',
      statusMessage: 'Resume analyzed successfully',
      parsedName: 'Alex Morgan',
      parsedEmail: 'alex.morgan@example.com',
      parsedPhone: '+1 (555) 019-2834',
      parsedSkills: [
        'React', 'TypeScript', 'Node.js', 'Express', 'Tailwind CSS',
        'State Management', 'REST APIs', 'Git', 'Agile Leadership'
      ],
      education: ['B.S. in Computer Science'],
      experience: ['Full Stack Engineer - Software Solutions'],
      projects: ['Full Stack Web Platform with React & Node.js'],
      certifications: [],
      detectedRole: targetJobRole || 'Full Stack Software Engineer',
      matchScore: 86,
      formattingScore: 92,
      keyHighlights: [
        'Clear typography and clean bullet structure',
        'Demonstrates end-to-end web application development experience',
        'Strong focus on modern TypeScript ecosystems'
      ],
      missingKeywords: ['Docker', 'Database Indexing', 'Unit Testing Coverage'],
      improvementSuggestions: [
        'Include measurable business metrics for past accomplishments.',
        'Align skill keywords with the target position description.'
      ]
    };

    this.lastAnalysis = analysis;
    return analysis;
  }

  async getLatestAnalysis(): Promise<ResumeAnalysis | null> {
    return this.lastAnalysis;
  }
}

export const resumeService = new ResumeServicePlaceholder();
