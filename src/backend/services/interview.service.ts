import { InterviewConfig, InterviewQuestion, AssessmentResult, InterviewType, QuestionAnswerMetadata } from '../../types';
import { aiService, AiNextQuestionParams } from './ai.service';

export interface IInterviewService {
  generateQuestionSet(config: InterviewConfig): Promise<InterviewQuestion[]>;
  generateNextQuestion(params: AiNextQuestionParams): Promise<InterviewQuestion>;
  evaluateAnswer(questionId: string, candidateAnswer: string): Promise<{ score: number; feedback: string }>;
  submitFullInterview(
    config: InterviewConfig,
    answers: Record<string, string>,
    sessionQuestions?: InterviewQuestion[],
    speechData?: Record<string, QuestionAnswerMetadata>
  ): Promise<AssessmentResult>;
  getHistory(): Promise<AssessmentResult[]>;
  getResultById(id: string): Promise<AssessmentResult | null>;
}

export class InterviewServicePlaceholder implements IInterviewService {
  private mockHistory: AssessmentResult[] = [
    {
      id: 'eval_101',
      title: 'Full Stack React & System Design Mock',
      type: 'Technical',
      date: '2026-08-05T14:30:00Z',
      durationMinutes: 28,
      overallScore: 88,
      metrics: {
        technicalDepth: 90,
        communication: 85,
        problemSolving: 88,
        confidence: 86,
        speed: 92,
      },
      summaryFeedback: 'Demonstrated exceptional understanding of state management, custom React hooks, and asynchronous API handling. Minor clarity improvements recommended when explaining database pagination strategies.',
      keyStrengths: [
        'Clear architectural explanation of optimistic UI updates',
        'Strong knowledge of TypeScript generic interfaces and state typing',
        'Structured problem-solving approach during live code exercise'
      ],
      areasToImprove: [
        'Elaborate more on error boundary recovery strategies',
        'Mention Redis caching layer benefits during database scaling questions'
      ],
      questionFeedbacks: [
        {
          questionId: 'q1',
          questionText: 'How do you optimize render performance in a high-frequency React dashboard?',
          candidateAnswer: 'I utilize React.memo for pure display components, useCallback for event listeners passed as props, and split state context to avoid full tree re-renders.',
          score: 92,
          evaluation: 'Strong technical depth and clear React optimization concepts.',
          improvementSuggestion: 'Could mention virtualized lists (react-window) for heavy datasets.',
          strengths: ['Identified context splitting and memoization correctly'],
          improvements: ['Could mention virtualized lists for rendering heavy datasets'],
          modelAnswer: 'Optimize by using windowing/virtualization (react-window), memoization (useMemo/useCallback), state collocation, and selector-based state management like Zustand or Redux Toolkit.'
        },
        {
          questionId: 'q2',
          questionText: 'Explain the difference between SQL indexed queries and MongoDB B-tree indexes.',
          candidateAnswer: 'Both use B-tree structures primarily for quick range and exact key lookups, but MongoDB single and compound indexes optimize JSON document traversal.',
          score: 84,
          evaluation: 'Accurate conceptual understanding of B-Tree indexing.',
          improvementSuggestion: 'Detail index cardinality and memory footprint implications.',
          strengths: ['Accurate conceptual understanding of B-Tree indexing'],
          improvements: ['Detail index cardinality and memory footprint implications'],
          modelAnswer: 'Both relational SQL and MongoDB utilize B-Trees or B+Trees for key indexing. MongoDB compound indexes must respect key order prefixing for multi-field queries.'
        }
      ],
      categoryScores: {
        communication: { score: 85, weight: 0.30, explanation: 'Clear and articulate technical explanations.', factors: ['Structured response delivery'] },
        confidence: { score: 86, weight: 0.25, explanation: 'Strong decisive technical phrasing.', factors: ['Answer-based estimate'] },
        technicalRelevance: { score: 90, weight: 0.30, explanation: 'High keyword density and architecture alignment.', factors: ['Relevant domain terms'] },
        professionalism: { score: 88, weight: 0.15, explanation: 'Formal professional delivery.', factors: ['Completed all questions'] },
      },
      weaknesses: ['Elaborate more on error boundary recovery strategies', 'Mention Redis caching benefits'],
      improvementSuggestions: ['Incorporate specific metrics in responses'],
      practiceRecommendations: ['System Architecture & Caching', 'Database Indexing']
    },
    {
      id: 'eval_102',
      title: 'Leadership & Cross-Functional Collaboration',
      type: 'Behavioral',
      date: '2026-08-02T10:15:00Z',
      durationMinutes: 22,
      overallScore: 92,
      categoryScores: {
        communication: { score: 95, weight: 0.30, explanation: 'Excellent STAR framework execution.', factors: ['Structured narrative'] },
        confidence: { score: 94, weight: 0.25, explanation: 'High conviction and leadership tone.', factors: ['Assertive phrasing'] },
        technicalRelevance: { score: 80, weight: 0.30, explanation: 'Good practical engineering context.', factors: ['Domain context'] },
        professionalism: { score: 92, weight: 0.15, explanation: 'Professional team orientation.', factors: ['Empathetic tone'] },
      },
      weaknesses: ['Quantify engineering outcomes with specific percentage metrics where possible'],
      improvementSuggestions: ['Include concrete throughput numbers'],
      practiceRecommendations: ['STAR Behavioral Framing'],
      metrics: {
        technicalDepth: 80,
        communication: 95,
        problemSolving: 90,
        confidence: 94,
        speed: 88,
      },
      summaryFeedback: 'Outstanding usage of the STAR framework (Situation, Task, Action, Result). Effectively demonstrated conflict resolution between engineering and product management constraints.',
      keyStrengths: [
        'Structured narrative responses following STAR methodology',
        'Strong empathetic leadership tone and clear conflict de-escalation examples'
      ],
      areasToImprove: [
        'Quantify engineering outcomes with specific percentage metrics where possible'
      ],
      questionFeedbacks: [
        {
          questionId: 'q_beh_1',
          questionText: 'Describe a time when product scope clashed with tight technical deadlines.',
          candidateAnswer: 'I facilitated a alignment session where we mapped core MVP user journeys, identified non-critical features, and negotiated a phased 2-week rollout.',
          score: 95,
          evaluation: 'Outstanding STAR alignment and pragmatic negotiation.',
          improvementSuggestion: 'Add quantitative impact of meeting the deadline.',
          strengths: ['Clear proactive leadership and pragmatic negotiation'],
          improvements: ['Add quantitative impact of meeting the deadline'],
          modelAnswer: 'A strong STAR response clearly states the conflict, the proactive negotiation steps, the consensus reached, and measured business results.'
        }
      ]
    },
    {
      id: 'eval_103',
      title: 'HR & Cultural Fit Assessment',
      type: 'HR',
      date: '2026-07-28T16:00:00Z',
      durationMinutes: 18,
      overallScore: 85,
      categoryScores: {
        communication: { score: 90, weight: 0.30, explanation: 'Articulate career vision and clear delivery.', factors: ['Clear delivery'] },
        confidence: { score: 88, weight: 0.25, explanation: 'Positive candidate enthusiasm.', factors: ['Decisive tone'] },
        technicalRelevance: { score: 75, weight: 0.30, explanation: 'General technical familiarity.', factors: ['Basic domain terms'] },
        professionalism: { score: 88, weight: 0.15, explanation: 'High professional decorum.', factors: ['Formal presentation'] },
      },
      weaknesses: ['Be more concise when explaining past job transitions'],
      improvementSuggestions: ['Keep career history summaries under 2 minutes'],
      practiceRecommendations: ['HR Elevate Pitch'],
      metrics: {
        technicalDepth: 75,
        communication: 90,
        problemSolving: 82,
        confidence: 88,
        speed: 85,
      },
      summaryFeedback: 'Great communication and career alignment. Highlighted continuous learning initiatives and clear alignment with agile engineering team cultures.',
      keyStrengths: ['Articulate career vision', 'High enthusiasm for collaborative team environments'],
      areasToImprove: ['Be more concise when explaining past job transitions'],
      questionFeedbacks: []
    }
  ];

  async generateNextQuestion(params: AiNextQuestionParams): Promise<InterviewQuestion> {
    const aiQ = await aiService.generateNextQuestion(params);
    if (aiQ) return aiQ;

    const dummyConfig: InterviewConfig = {
      type: params.type,
      targetRole: params.domain,
      experienceLevel: params.difficulty,
      questionCount: params.totalQuestions,
      includeCodeSnippet: params.includeCodeSnippet,
      resumeSkills: params.resumeSkills,
    };

    const set = await this.generateQuestionSet(dummyConfig);
    const fallbackIndex = (params.questionNumber - 1) % set.length;
    const fallbackQ = set[fallbackIndex];
    return {
      ...fallbackQ,
      questionNumber: params.questionNumber,
      id: `q_fallback_${params.questionNumber}_${Date.now()}`,
    };
  }

  async generateQuestionSet(config: InterviewConfig): Promise<InterviewQuestion[]> {
    // 1. Try real AI question generation first
    const aiQuestions = await aiService.generateQuestions({
      type: config.type,
      difficulty: config.experienceLevel || 'Senior',
      domain: config.targetRole || config.type,
      resumeSkills: config.resumeSkills,
      questionCount: config.questionCount,
      topics: config.topics,
      includeCodeSnippet: config.includeCodeSnippet,
    });

    if (aiQuestions && aiQuestions.length > 0) {
      return aiQuestions.map(q => ({ ...q, isAiGenerated: true }));
    }

    const questionsByType: Record<InterviewType, InterviewQuestion[]> = {
      Technical: [
        {
          id: 'q_tech_1',
          questionNumber: 1,
          category: 'Technical',
          questionText: `In a high-scale ${config.targetRole || 'Software Engineering'} application, how do you handle state management, async data synchronization, and optimistic UI updates?`,
          hint: 'Consider mentioning React Query / SWR, client cache invalidation, and rollback handling on request failure.',
          sampleCodeSnippet: `// Example TypeScript Async Hook
const useUpdateCandidateStatus = () => {
  // Implement optimistic update pattern
};`,
          timeAllowedSeconds: 180,
        },
        {
          id: 'q_tech_2',
          questionNumber: 2,
          category: 'Technical',
          questionText: 'Explain how you design RESTful and GraphQL API layers for latency optimization, caching, and payload compression.',
          hint: 'Discuss ETag header caching, CDN edge distribution, and query complexity limits.',
          timeAllowedSeconds: 180,
        },
        {
          id: 'q_tech_3',
          questionNumber: 3,
          category: 'Technical',
          questionText: 'Walk us through how you prevent security vulnerabilities like XSS, CSRF, and SQL/NoSQL injection in modern Web Applications.',
          hint: 'Mention HttpOnly SameSite cookies, CORS configuration, input sanitization, and parameterized queries.',
          timeAllowedSeconds: 180,
        }
      ],
      HR: [
        {
          id: 'q_hr_1',
          questionNumber: 1,
          category: 'HR',
          questionText: 'Tell me about yourself and why you are interested in transitioning into or elevating your career as a ' + (config.targetRole || 'Software Leader') + '.',
          hint: 'Keep response under 2 minutes. Structure as Past Experience -> Present Focus -> Future Goal.',
          timeAllowedSeconds: 120,
        },
        {
          id: 'q_hr_2',
          questionNumber: 2,
          category: 'HR',
          questionText: 'What are your salary expectations and what key growth factors do you look for in a team culture?',
          hint: 'Focus on market range research, continuous learning opportunities, and mentorship.',
          timeAllowedSeconds: 120,
        }
      ],
      Behavioral: [
        {
          id: 'q_beh_1',
          questionNumber: 1,
          category: 'Behavioral',
          questionText: 'Describe a situation where a technical project was falling behind schedule. How did you handle stakeholder expectations and team output?',
          hint: 'Use the STAR method: Situation, Task, Action, Result.',
          timeAllowedSeconds: 180,
        },
        {
          id: 'q_beh_2',
          questionNumber: 2,
          category: 'Behavioral',
          questionText: 'Give an example of receiving critical feedback on your work or code review. How did you respond and incorporate it?',
          hint: 'Focus on growth mindset, active listening, and technical improvement steps.',
          timeAllowedSeconds: 180,
        }
      ],
      Aptitude: [
        {
          id: 'q_apt_1',
          questionNumber: 1,
          category: 'Aptitude',
          questionText: 'A system processes 10,000 requests per minute with a 99.9% success SLA. If latency spikes by 40% under peak load, how do you mathematically locate the bottleneck?',
          hint: 'Break down requests into concurrency, CPU/Memory profiling, and DB query response histograms.',
          timeAllowedSeconds: 150,
        },
        {
          id: 'q_apt_2',
          questionNumber: 2,
          category: 'Aptitude',
          questionText: 'If 3 engineers complete a feature in 12 days, how many days will 4 engineers take assuming a 15% communication overhead reduction in velocity per extra team member?',
          hint: 'Calculate total man-days required, adjust for individual velocity efficiency factor.',
          timeAllowedSeconds: 150,
        }
      ]
    };

    const questions = questionsByType[config.type] || questionsByType['Technical'];
    return questions.slice(0, Math.min(config.questionCount, questions.length)).map(q => ({ ...q, isAiGenerated: false }));
  }

  async evaluateAnswer(questionId: string, candidateAnswer: string): Promise<{ score: number; feedback: string }> {
    const wordCount = candidateAnswer.trim().split(/\s+/).length;
    let score = Math.min(95, Math.max(50, wordCount * 2));
    if (candidateAnswer.length < 10) score = 30;

    return {
      score,
      feedback: `Response evaluated cleanly. Score calculated at ${score}%. Demonstrated clear key concepts.`,
    };
  }

  async submitFullInterview(
    config: InterviewConfig,
    answers: Record<string, string>,
    sessionQuestions?: InterviewQuestion[],
    speechData?: Record<string, QuestionAnswerMetadata>
  ): Promise<AssessmentResult> {
    const questions = sessionQuestions && sessionQuestions.length > 0 ? sessionQuestions : await this.generateQuestionSet(config);

    // 1. Try real AI evaluation first
    const aiEval = await aiService.evaluateInterview({
      config,
      questions,
      answers,
      speechData,
      resumeSkills: config.resumeSkills,
    });

    if (aiEval) {
      const comm = aiEval.categoryScores.communication;
      const conf = aiEval.categoryScores.confidence;
      const tech = aiEval.categoryScores.technicalRelevance;
      const prof = aiEval.categoryScores.professionalism;

      // SCORING: Communication = 30%, Confidence = 25%, Technical Relevance = 30%, Professionalism = 15%
      const overallScore = Math.min(100, Math.max(0, Math.round(
        comm * 0.30 + conf * 0.25 + tech * 0.30 + prof * 0.15
      )));

      const questionFeedbacks = aiEval.questionEvaluations.map((qe) => ({
        questionId: qe.questionId,
        questionText: qe.questionText,
        candidateAnswer: qe.candidateAnswer,
        score: qe.score,
        evaluation: qe.evaluation,
        improvementSuggestion: qe.improvementSuggestion,
        strengths: qe.strengths || ['Clear technical concepts'],
        improvements: qe.improvements || ['Incorporate real-world impact metrics'],
        modelAnswer: 'An optimal response articulates clear context, core technical mechanisms, trade-offs, and verified outcomes.'
      }));

      const newResult: AssessmentResult = {
        id: `eval_${Date.now()}`,
        title: `${config.type} Mock Interview (${config.targetRole})`,
        type: config.type,
        domain: config.targetRole,
        date: new Date().toISOString(),
        durationMinutes: Math.round(config.questionCount * 3.5),
        overallScore,
        isAiEvaluated: true,
        evaluationSource: 'Gemini AI',
        categoryScores: {
          communication: { score: comm, weight: 0.30, explanation: 'AI evaluation of candidate articulation and delivery.', factors: ['Structure & Clarity', 'Conciseness'] },
          confidence: { score: conf, weight: 0.25, explanation: 'AI evaluation of assertive phrasing and decision conviction.', factors: ['Answer phrasing', 'Decisive tone'] },
          technicalRelevance: { score: tech, weight: 0.30, explanation: 'AI evaluation of domain keyword depth and technical accuracy.', factors: ['Domain concepts', 'Keyword alignment'] },
          professionalism: { score: prof, weight: 0.15, explanation: 'AI evaluation of formal presentation and interview decorum.', factors: ['Formal delivery', 'Session completion'] },
        },
        metrics: {
          technicalDepth: tech,
          communication: comm,
          problemSolving: overallScore,
          confidence: conf,
          speed: 88,
        },
        summaryFeedback: aiEval.summaryFeedback || `AI-evaluated ${config.type} mock interview for ${config.targetRole}.`,
        keyStrengths: aiEval.strengths,
        weaknesses: aiEval.weaknesses,
        areasToImprove: aiEval.weaknesses,
        improvementSuggestions: aiEval.improvementSuggestions,
        practiceRecommendations: aiEval.practiceRecommendations,
        questionFeedbacks,
      };

      this.mockHistory.unshift(newResult);
      return newResult;
    }

    // 2. Fall back to local rules-based evaluation
    const questionFeedbacks = questions.map(q => {
      const ans = answers[q.id] || answers[q.questionNumber?.toString()] || 'No response provided.';
      const score = ans.length > 20 ? 82 : 50;
      return {
        questionId: q.id,
        questionText: q.questionText,
        candidateAnswer: ans,
        score,
        evaluation: score > 80 ? 'Good response depth and technical terminology.' : 'Brief response needing expansion.',
        improvementSuggestion: 'Incorporate concrete real-world metrics.',
        strengths: ['Addressed main question objectives clearly'],
        improvements: ['Elaborate with specific architectural metrics or code examples'],
        modelAnswer: 'An optimal response provides clear context, technical mechanism, trade-offs, and verified outcomes.'
      };
    });

    const comm = Math.min(100, Math.round(questionFeedbacks.reduce((sum, f) => sum + f.score, 0) / (questionFeedbacks.length || 1)));
    const conf = Math.max(50, comm - 2);
    const tech = Math.min(100, comm + 4);
    const prof = 88;

    const overallScore = Math.min(100, Math.max(0, Math.round(
      comm * 0.30 + conf * 0.25 + tech * 0.30 + prof * 0.15
    )));

    const newResult: AssessmentResult = {
      id: `eval_${Date.now()}`,
      title: `${config.type} Mock Interview (${config.targetRole})`,
      type: config.type,
      domain: config.targetRole,
      date: new Date().toISOString(),
      durationMinutes: Math.round(config.questionCount * 3.5),
      overallScore,
      isAiEvaluated: false,
      evaluationSource: 'Local Rule Engine',
      categoryScores: {
        communication: { score: comm, weight: 0.30, explanation: 'Local estimate of communication style.', factors: ['Length & structure'] },
        confidence: { score: conf, weight: 0.25, explanation: 'Local estimate of technical tone.', factors: ['Direct phrasing'] },
        technicalRelevance: { score: tech, weight: 0.30, explanation: 'Local estimate of domain keyword density.', factors: ['Domain terms'] },
        professionalism: { score: prof, weight: 0.15, explanation: 'Local evaluation of formal delivery.', factors: ['Session completion'] },
      },
      metrics: {
        technicalDepth: tech,
        communication: comm,
        problemSolving: overallScore,
        confidence: conf,
        speed: 88,
      },
      summaryFeedback: `Completed local rules-based ${config.type} assessment for ${config.targetRole}.`,
      keyStrengths: [
        `Grasp of ${config.type.toLowerCase()} interview fundamentals`,
        'Structured response delivery with good clarity'
      ],
      weaknesses: [
        'Provide deeper real-world project examples with measurable impact metrics',
        'Practice time management on complex multi-part questions'
      ],
      areasToImprove: [
        'Provide deeper real-world project examples with measurable impact metrics',
        'Practice time management on complex multi-part questions'
      ],
      improvementSuggestions: ['Structure answers with STAR method.'],
      practiceRecommendations: ['Technical Architecture & Scalability'],
      questionFeedbacks,
    };

    this.mockHistory.unshift(newResult);
    return newResult;
  }

  async getHistory(): Promise<AssessmentResult[]> {
    return this.mockHistory;
  }

  async getResultById(id: string): Promise<AssessmentResult | null> {
    return this.mockHistory.find(r => r.id === id) || this.mockHistory[0];
  }
}

export const interviewService = new InterviewServicePlaceholder();
