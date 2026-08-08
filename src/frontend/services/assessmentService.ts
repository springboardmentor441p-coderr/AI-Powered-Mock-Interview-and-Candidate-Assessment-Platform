import {
  CompletedInterviewSession,
  AssessmentResult,
  CategoryDetail,
  QuestionFeedback,
  AnalyticsSummary,
  InterviewType,
} from '../../types';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const ASSESSMENTS_STORAGE_KEY = 'smarthire_assessments_history';
const LATEST_ASSESSMENT_KEY = 'smarthire_latest_assessment';

export const assessmentService = {
  /**
   * Main entry point: Generates a weighted assessment from a completed interview session
   */
  generateAssessment(session: CompletedInterviewSession): AssessmentResult {
    const questions = session.questions || [];
    const answers = session.answers || {};

    const domain = session.domain || session.type || 'Software Engineering';
    const totalQuestions = questions.length;

    // 1. Evaluate individual questions
    const questionFeedbacks: QuestionFeedback[] = [];
    let totalWordCount = 0;
    let totalKeywordMatches = 0;
    let totalFillerWords = 0;
    let totalAssertivePhrases = 0;
    let totalExamplePhrases = 0;
    let totalQuestionScores = 0;

    const domainKeywords = [
      'state', 'architecture', 'component', 'performance', 'cache', 'database',
      'api', 'async', 'sync', 'optimization', 'index', 'scale', 'security',
      'token', 'jwt', 'query', 'memory', 'latency', 'redis', 'postgres',
      'rest', 'graphql', 'hook', 'props', 'thread', 'concurrency', 'lock',
      'microservice', 'docker', 'pipeline', 'ci/cd', 'star', 'bug', 'diagnostic',
      'log', 'metric', 'monitor', 'leader', 'team', 'trade-off', 'testing',
      'refactor', 'schema', 'deployment', 'load balancer', 'middleware'
    ];

    const fillerWords = ['um', 'uh', 'like basically', 'you know', 'kind of', 'i guess', 'maybe', 'not sure', "don't know"];
    const assertivePhrases = ['i recommended', 'we architected', 'i ensured', 'the optimal approach', 'we implemented', 'resolved by', 'i designed', 'specifically', 'led to'];
    const examplePhrases = ['for example', 'for instance', 'such as', 'specifically', 'in my experience', 'resulted in', 'because'];

    questions.forEach((q, idx) => {
      const answerText = (answers[q.id] || '').trim();
      const lowerAnswer = answerText.toLowerCase();

      let qScore = 0;
      let evalText = '';
      let impText = '';

      if (!answerText) {
        qScore = 0;
        evalText = 'Question was left unanswered. No technical context or candidate reasoning was provided.';
        impText = 'Ensure every interview question is attempted, even if outlining key architectural concepts or bullet points.';
      } else {
        const words = answerText.split(/\s+/).filter(Boolean);
        const wCount = words.length;
        totalWordCount += wCount;

        // Base score from length
        let baseScore = 40;
        if (wCount >= 120) baseScore = 85;
        else if (wCount >= 70) baseScore = 75;
        else if (wCount >= 35) baseScore = 65;
        else if (wCount >= 15) baseScore = 50;

        // Domain keyword count
        let qKeywords = 0;
        domainKeywords.forEach((kw) => {
          if (lowerAnswer.includes(kw)) {
            qKeywords++;
            totalKeywordMatches++;
          }
        });

        // Fillers check
        fillerWords.forEach((fw) => {
          if (lowerAnswer.includes(fw)) totalFillerWords++;
        });

        // Assertive phrases check
        assertivePhrases.forEach((ap) => {
          if (lowerAnswer.includes(ap)) totalAssertivePhrases++;
        });

        // Example phrases check
        examplePhrases.forEach((ep) => {
          if (lowerAnswer.includes(ep)) totalExamplePhrases++;
        });

        // Score modifiers
        let keywordBonus = Math.min(15, qKeywords * 3);
        let structureBonus = (answerText.includes('\n') || answerText.includes('1.') || answerText.includes('-')) ? 5 : 0;
        let exampleBonus = examplePhrases.some((ep) => lowerAnswer.includes(ep)) ? 5 : 0;

        qScore = Math.min(100, Math.max(15, baseScore + keywordBonus + structureBonus + exampleBonus));

        if (qScore >= 85) {
          evalText = `Comprehensive response (${wCount} words). Well-structured with relevant domain terms like "${domainKeywords.find(k => lowerAnswer.includes(k)) || 'architecture'}".`;
          impText = 'Further strengthen by quantifying business or engineering impact (e.g., % latency reduction or throughput metrics).';
        } else if (qScore >= 65) {
          evalText = `Clear answer (${wCount} words) covering core concepts, but could benefit from deeper trade-off analysis.`;
          impText = 'Incorporate concrete real-world implementation examples and edge-case handling.';
        } else {
          evalText = `Brief response (${wCount} words). Contains basic ideas but lacks comprehensive technical depth.`;
          impText = 'Expand your answer to explain the "why" behind your technical decisions, including error handling strategies.';
        }
      }

      totalQuestionScores += qScore;

      questionFeedbacks.push({
        questionId: q.id,
        questionText: q.questionText,
        category: q.category || session.type,
        candidateAnswer: answerText || 'Unanswered',
        score: qScore,
        evaluation: evalText,
        improvementSuggestion: impText,
        modelAnswer: q.hint ? `Key elements to cover: ${q.hint}` : undefined,
      });
    });

    const avgQuestionScore = totalQuestions > 0 ? totalQuestionScores / totalQuestions : 0;
    const answeredRatio = totalQuestions > 0 ? session.answeredCount / totalQuestions : 0;

    // 2. Calculate Weighted Category Scores (0-100)

    // Communication (30% weight)
    const commBase = Math.round(avgQuestionScore * 0.6 + answeredRatio * 30 + Math.min(10, totalWordCount / 40));
    const commScore = Math.min(100, Math.max(10, commBase));
    const commFactors: string[] = [];
    if (answeredRatio >= 1) commFactors.push('Answered 100% of assessment questions');
    else commFactors.push(`Unanswered questions penalty (${session.unansweredCount} missed)`);
    if (totalWordCount > 250) commFactors.push('Sufficient elaboration and word volume provided');
    else commFactors.push('Brief answer lengths reduced total communication depth');
    if (totalExamplePhrases > 0) commFactors.push('Used concrete illustrative phrases and examples');

    const communication: CategoryDetail = {
      score: commScore,
      weight: 0.30,
      explanation: commScore >= 80
        ? 'Demonstrates clear, articulate technical expression with logical progression.'
        : commScore >= 60
        ? 'Good foundational clarity, though some answers were concise or lacked structural framing.'
        : 'Communication requires expansion. Answers were brief or incomplete.',
      factors: commFactors,
    };

    // Confidence (25% weight - Answer-based confidence estimate)
    const confBase = Math.round(
      60 +
      Math.min(25, totalAssertivePhrases * 6) +
      (answeredRatio * 20) -
      Math.min(20, totalFillerWords * 5)
    );
    const confScore = Math.min(100, Math.max(10, confBase));
    const confFactors: string[] = [];
    confFactors.push('Answer-based linguistic confidence estimate');
    if (totalAssertivePhrases > 0) confFactors.push(`Used ${totalAssertivePhrases} decisive technical conviction phrases`);
    if (totalFillerWords > 0) confFactors.push(`Detected ${totalFillerWords} hesitation or uncertainty terms`);
    else confFactors.push('Zero hesitation phrases detected in response transcript');

    const confidence: CategoryDetail = {
      score: confScore,
      weight: 0.25,
      explanation: confScore >= 80
        ? 'High candidate conviction detected through decisive phrasing and proactive problem solving.'
        : confScore >= 60
        ? 'Moderate confidence displayed. Conviction can be boosted by avoiding hedging language.'
        : 'Answers indicated uncertainty or hesitation. Practice framing solutions decisively.',
      factors: confFactors,
      isAnswerBasedEstimate: true,
    };

    // Technical Relevance (30% weight)
    const techBase = Math.round(avgQuestionScore * 0.7 + Math.min(30, totalKeywordMatches * 4));
    const techScore = Math.min(100, Math.max(10, techBase));
    const techFactors: string[] = [];
    if (totalKeywordMatches > 5) techFactors.push(`High domain keyword density (${totalKeywordMatches} key technical terms identified)`);
    else techFactors.push('Lower domain keyword density found in answers');
    if (avgQuestionScore >= 75) techFactors.push('Demonstrated strong alignment with target role technical concepts');

    const technicalRelevance: CategoryDetail = {
      score: techScore,
      weight: 0.30,
      explanation: techScore >= 80
        ? 'Strong technical accuracy and rich usage of domain-relevant concepts.'
        : techScore >= 60
        ? 'Adequate technical understanding, but missed mentioning secondary trade-offs or tools.'
        : 'Limited technical keyword coverage. Practice articulating architectural details.',
      factors: techFactors,
    };

    // Professionalism (15% weight)
    const profBase = Math.round(70 + (answeredRatio * 20) + (totalWordCount > 150 ? 10 : 0) - (totalFillerWords * 3));
    const profScore = Math.min(100, Math.max(10, profBase));
    const profFactors: string[] = [];
    profFactors.push('Professional vocabulary and structural tone evaluated');
    if (answeredRatio === 1) profFactors.push('Completed session in full professional compliance');
    if (totalWordCount > 100) profFactors.push('Maintained formal written demeanor throughout');

    const professionalism: CategoryDetail = {
      score: profScore,
      weight: 0.15,
      explanation: profScore >= 80
        ? 'Exemplary professional tone and thorough execution.'
        : profScore >= 60
        ? 'Solid professional presentation with standard interview decorum.'
        : 'Tone and completeness need refinement.',
      factors: profFactors,
    };

    // 3. Calculate Weighted Overall Score
    const overallScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          commScore * 0.30 +
          confScore * 0.25 +
          techScore * 0.30 +
          profScore * 0.15
        )
      )
    );

    // 4. Strengths, Weaknesses, Suggestions & Recommendations
    const keyStrengths: string[] = [];
    const weaknesses: string[] = [];
    const improvementSuggestions: string[] = [];
    const practiceRecommendations: string[] = [];

    // Derive strengths
    if (techScore >= 70) {
      keyStrengths.push('Strong technical vocabulary and domain knowledge alignment with target engineering expectations.');
    } else {
      keyStrengths.push('Showed clear interest and core conceptual familiarity with the subject domain.');
    }

    if (commScore >= 70) {
      keyStrengths.push('Well-structured explanation style with logical progression across key response paragraphs.');
    } else {
      keyStrengths.push('Prompt submission of candidate responses with focused topic addressing.');
    }

    if (confScore >= 75) {
      keyStrengths.push('Assertive and confident tone when articulating solution architectures and decisions.');
    } else if (keyStrengths.length < 2) {
      keyStrengths.push('Maintained steady composure and completed key assessment milestones.');
    }

    // Derive weaknesses
    if (session.unansweredCount > 0) {
      weaknesses.push(`Unanswered questions (${session.unansweredCount} question(s) left blank during session).`);
    } else if (totalWordCount < 150) {
      weaknesses.push('Response length was relatively brief, omitting secondary implementation nuances.');
    } else {
      weaknesses.push('Could provide deeper quantification of engineering results (e.g., memory overhead or latency metrics).');
    }

    if (techScore < 75) {
      weaknesses.push('Limited depth in advanced architectural trade-offs, security considerations, or caching patterns.');
    } else if (totalFillerWords > 0) {
      weaknesses.push('Occasional presence of filler or uncertainty phrases in response text.');
    } else {
      weaknesses.push('Opportunities to discuss edge-case error recovery and fallback mechanisms.');
    }

    // Derive improvement suggestions
    improvementSuggestions.push(
      'Structure technical responses using the STAR method (Situation, Task, Action, Result) to emphasize personal impact.'
    );
    if (techScore < 80) {
      improvementSuggestions.push(
        'Incorporate specific tooling and framework keywords (e.g., Redis, PostgreSQL indexing, JWT validation, React memoization) to signal mastery.'
      );
    }
    if (confScore < 80) {
      improvementSuggestions.push(
        'Use assertive phrasing like "I recommended and implemented..." rather than hesitant qualifiers like "I think maybe...".'
      );
    }

    // Practice recommendations
    practiceRecommendations.push(`${domain} System Architecture & Scalability Patterns`);
    if (session.type === 'Technical') {
      practiceRecommendations.push('API Design, Rate Limiting & Token Authentication');
      practiceRecommendations.push('Database Indexing, Caching & Performance Tuning');
    } else if (session.type === 'Behavioral' || session.type === 'HR') {
      practiceRecommendations.push('STAR Behavioral Framing & Stakeholder Communication');
      practiceRecommendations.push('Engineering Leadership & Cross-Functional Conflict Resolution');
    } else {
      practiceRecommendations.push('Problem Solving & Analytical Case Studies');
    }

    const durationMinutes = Math.max(1, Math.round(session.durationSeconds / 60));
    const title = `${session.type} Mock Assessment - ${domain}`;

    const assessmentResult: AssessmentResult = {
      id: 'ast_' + Date.now(),
      interviewId: session.interviewId,
      title,
      type: session.type as InterviewType,
      domain,
      date: new Date().toISOString(),
      durationMinutes,
      overallScore,
      categoryScores: {
        communication,
        confidence,
        technicalRelevance,
        professionalism,
      },
      metrics: {
        technicalDepth: techScore,
        communication: commScore,
        problemSolving: Math.round((techScore + commScore) / 2),
        confidence: confScore,
        speed: Math.min(100, Math.max(50, 100 - Math.round(durationMinutes * 2))),
      },
      summaryFeedback: `Candidate achieved an overall weighted readiness score of ${overallScore}%. Technical Relevance evaluated at ${techScore}%, Communication at ${commScore}%, Confidence (answer-based) at ${confScore}%, and Professionalism at ${profScore}%.`,
      keyStrengths,
      weaknesses,
      areasToImprove: weaknesses,
      improvementSuggestions,
      practiceRecommendations,
      questionFeedbacks,
    };

    // Save automatically
    this.saveAssessment(assessmentResult);

    return assessmentResult;
  },

  /**
   * Save assessment to localStorage and Firebase Firestore database
   */
  async saveAssessment(result: AssessmentResult): Promise<void> {
    try {
      localStorage.setItem(LATEST_ASSESSMENT_KEY, JSON.stringify(result));
      sessionStorage.setItem(LATEST_ASSESSMENT_KEY, JSON.stringify(result));

      const existing = this.getAllAssessments();
      // Remove duplicate if same ID
      const filtered = existing.filter((item) => item.id !== result.id && item.interviewId !== result.interviewId);
      const updated = [result, ...filtered];

      localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save assessment in storage:', err);
    }

    // Persist to Firebase Firestore
    const path = 'assessments';
    try {
      await setDoc(doc(db, path, result.id), {
        ...result,
        createdAt: new Date().toISOString(),
      });
      console.log(`[AssessmentService] Successfully stored assessment in Firestore at ${path}/${result.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Retrieve all saved assessments from Firestore or local fallback
   */
  async getAllAssessmentsAsync(): Promise<AssessmentResult[]> {
    const path = 'assessments';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const results: AssessmentResult[] = [];
        querySnapshot.forEach((docSnap) => {
          results.push(docSnap.data() as AssessmentResult);
        });
        localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(results));
        return results;
      }
    } catch (error) {
      console.warn('[AssessmentService] Could not fetch assessments from Firestore, using local cache:', error);
    }

    return this.getAllAssessments();
  },

  /**
   * Retrieve latest generated assessment
   */
  getLatestAssessment(): AssessmentResult | null {
    try {
      const raw = localStorage.getItem(LATEST_ASSESSMENT_KEY) || sessionStorage.getItem(LATEST_ASSESSMENT_KEY);
      if (raw) {
        return JSON.parse(raw) as AssessmentResult;
      }
      const all = this.getAllAssessments();
      return all.length > 0 ? all[0] : null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieve all saved assessments
   */
  getAllAssessments(): AssessmentResult[] {
    try {
      const raw = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as AssessmentResult[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Seed rich sample demo data for mock interviews
   */
  seedDemoData(): AssessmentResult[] {
    const now = Date.now();
    const demoItems: AssessmentResult[] = [
      {
        id: 'eval_demo_1',
        interviewId: 'int_demo_1',
        title: 'Senior Full-Stack Engineer Mock',
        type: 'Technical',
        domain: 'Software Engineering',
        date: new Date(now - 86400000 * 1).toISOString(),
        overallScore: 88,
        durationMinutes: 18,
        summary: 'Excellent technical depth, structured code explanation, and strong domain terminology usage across all questions.',
        strengths: [
          'Articulated React state management and virtual DOM rendering pipeline clearly.',
          'Demonstrated deep knowledge of SQL indexing, query optimization, and latency trade-offs.',
          'Used precise engineering terminology (e.g. idempotency, event loop, connection pooling).'
        ],
        improvements: [
          'Elaborate more on specific unit testing strategies (e.g., mock handlers, integration tests).',
          'Reduce filler phrases like "basically" when framing complex trade-offs.'
        ],
        categoryScores: {
          communication: {
            score: 85,
            level: 'Strong',
            feedback: 'Clear delivery with steady pace and structured logic.'
          },
          confidence: {
            score: 90,
            level: 'Excellent',
            feedback: 'High self-assurance, minimal pauses, and assertive explanations.'
          },
          technicalRelevance: {
            score: 92,
            level: 'Excellent',
            feedback: 'Covers key architectural patterns, edge cases, and performance considerations.'
          },
          professionalism: {
            score: 85,
            level: 'Strong',
            feedback: 'Professional tone and structured responses throughout.'
          }
        },
        metrics: {
          wpm: 145,
          clarityScore: 88,
          confidence: 90,
          technicalDepth: 92,
          communication: 85,
          problemSolving: 89,
          speechPaceText: '145 WPM (Optimal Speed)',
          fillersCount: 2,
          assertivePhrasesCount: 6,
          keywordsMatchedCount: 14
        },
        questionFeedbacks: [
          {
            questionId: 'q1',
            questionText: 'Explain how you optimize frontend performance and handle re-renders in large React applications.',
            score: 92,
            candidateAnswer: 'I focus on memoization using useMemo and useCallback for expensive calculations, lazy loading code splits using React.lazy, and virtualization for large DOM lists.',
            evaluation: 'Strong coverage of core optimization strategies and DOM cost controls.',
            improvementTip: 'Mention profiling tools like React DevTools Profiler to measure metrics quantitatively.'
          },
          {
            questionId: 'q2',
            questionText: 'How do you design a database schema to support high-throughput read operations?',
            score: 85,
            candidateAnswer: 'I implement database indexing on frequently queried columns, read replicas for horizontal scale, and a Redis caching layer in front of PostgreSQL.',
            evaluation: 'Good architectural awareness covering caching and read replicas.',
            improvementTip: 'Discuss cache invalidation strategies (e.g. write-through vs TTL expiry).'
          }
        ]
      },
      {
        id: 'eval_demo_2',
        interviewId: 'int_demo_2',
        title: 'System Design & Distributed Systems Mock',
        type: 'Technical',
        domain: 'Backend Architecture',
        date: new Date(now - 86400000 * 3).toISOString(),
        overallScore: 82,
        durationMinutes: 22,
        summary: 'Solid grasp of microservices, message queues, and distributed caching, with room for deeper security considerations.',
        strengths: [
          'Well-structured explanation of Kafka event streaming and asynchronous decoupled messaging.',
          'Understands load balancing techniques and horizontal scaling.'
        ],
        improvements: [
          'Incorporate OAuth token validation and rate limiting middleware into initial architecture diagrams.'
        ],
        categoryScores: {
          communication: {
            score: 82,
            level: 'Strong',
            feedback: 'Good logical flow and systematic breakdown.'
          },
          confidence: {
            score: 80,
            level: 'Good',
            feedback: 'Slight hesitation during security-related follow-up questions.'
          },
          technicalRelevance: {
            score: 86,
            level: 'Strong',
            feedback: 'Rich technical depth on distributed caching and database partitioning.'
          },
          professionalism: {
            score: 80,
            level: 'Good',
            feedback: 'Polished communication.'
          }
        },
        metrics: {
          wpm: 138,
          clarityScore: 82,
          confidence: 80,
          technicalDepth: 86,
          communication: 82,
          problemSolving: 84,
          speechPaceText: '138 WPM (Optimal Speed)',
          fillersCount: 4,
          assertivePhrasesCount: 4,
          keywordsMatchedCount: 11
        },
        questionFeedbacks: []
      },
      {
        id: 'eval_demo_3',
        interviewId: 'int_demo_3',
        title: 'Behavioral & Leadership STAR Mock',
        type: 'Behavioral',
        domain: 'Engineering Management',
        date: new Date(now - 86400000 * 5).toISOString(),
        overallScore: 78,
        durationMinutes: 15,
        summary: 'Good use of the STAR method (Situation, Task, Action, Result). Highlight specific business impacts with numbers.',
        strengths: [
          'Clear story structure describing conflict resolution between product and engineering.',
          'Empathetic approach to team mentorship and cross-functional alignment.'
        ],
        improvements: [
          'Quantify outcomes with concrete metrics (e.g. "reduced incident rates by 35%").'
        ],
        categoryScores: {
          communication: {
            score: 88,
            level: 'Strong',
            feedback: 'Engaging narrative and clear articulation of personal actions.'
          },
          confidence: {
            score: 78,
            level: 'Good',
            feedback: 'Good tone and composed delivery.'
          },
          technicalRelevance: {
            score: 70,
            level: 'Developing',
            feedback: 'Focus was primarily on interpersonal aspects.'
          },
          professionalism: {
            score: 85,
            level: 'Strong',
            feedback: 'Professional, articulate, and empathetic.'
          }
        },
        metrics: {
          wpm: 152,
          clarityScore: 85,
          confidence: 78,
          technicalDepth: 70,
          communication: 88,
          problemSolving: 76,
          speechPaceText: '152 WPM (Slightly Fast)',
          fillersCount: 3,
          assertivePhrasesCount: 5,
          keywordsMatchedCount: 6
        },
        questionFeedbacks: []
      }
    ];

    try {
      localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(demoItems));
      localStorage.setItem(LATEST_ASSESSMENT_KEY, JSON.stringify(demoItems[0]));
      sessionStorage.setItem(LATEST_ASSESSMENT_KEY, JSON.stringify(demoItems[0]));
    } catch (e) {
      console.warn('Failed to seed demo data to localStorage:', e);
    }

    return demoItems;
  },

  /**
   * Calculates dynamic analytics summary from real saved assessments
   */
  getAnalyticsSummary(): AnalyticsSummary {
    const assessments = this.getAllAssessments();

    if (assessments.length === 0) {
      // Return clean fallback structure when no assessments exist yet
      return {
        totalInterviews: 0,
        averageScore: 0,
        totalPracticeTimeMinutes: 0,
        readinessLevel: 'Developing',
        radarMetrics: [
          { metric: 'Technical Depth', score: 0 },
          { metric: 'Communication', score: 0 },
          { metric: 'Confidence', score: 0 },
          { metric: 'Professionalism', score: 0 },
          { metric: 'Problem Solving', score: 0 },
        ],
        recentPerformance: [],
        categoryBreakdown: [
          { type: 'Technical', count: 0, avgScore: 0 },
          { type: 'Behavioral', count: 0, avgScore: 0 },
          { type: 'HR', count: 0, avgScore: 0 },
          { type: 'Aptitude', count: 0, avgScore: 0 },
        ],
      };
    }

    const totalInterviews = assessments.length;
    const scoreSum = assessments.reduce((acc, cur) => acc + (cur.overallScore || 0), 0);
    const averageScore = Math.round(scoreSum / totalInterviews);
    const totalPracticeTimeMinutes = assessments.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);

    let readinessLevel: 'Developing' | 'Job Ready' | 'Highly Competitive' = 'Developing';
    if (averageScore >= 85) readinessLevel = 'Highly Competitive';
    else if (averageScore >= 70) readinessLevel = 'Job Ready';

    // Calculate radar metrics averages
    const avgTech = Math.round(assessments.reduce((a, c) => a + (c.categoryScores?.technicalRelevance?.score ?? c.metrics?.technicalDepth ?? 70), 0) / totalInterviews);
    const avgComm = Math.round(assessments.reduce((a, c) => a + (c.categoryScores?.communication?.score ?? c.metrics?.communication ?? 70), 0) / totalInterviews);
    const avgConf = Math.round(assessments.reduce((a, c) => a + (c.categoryScores?.confidence?.score ?? c.metrics?.confidence ?? 70), 0) / totalInterviews);
    const avgProf = Math.round(assessments.reduce((a, c) => a + (c.categoryScores?.professionalism?.score ?? 75), 0) / totalInterviews);
    const avgProblem = Math.round(assessments.reduce((a, c) => a + (c.metrics?.problemSolving ?? 70), 0) / totalInterviews);

    const radarMetrics = [
      { metric: 'Technical Depth', score: avgTech },
      { metric: 'Communication', score: avgComm },
      { metric: 'Confidence', score: avgConf },
      { metric: 'Professionalism', score: avgProf },
      { metric: 'Problem Solving', score: avgProblem },
    ];

    // Recent performance items (up to 6)
    const recentPerformance = assessments.slice(0, 6).map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.overallScore,
      category: item.type,
    }));

    // Category Breakdown
    const types: InterviewType[] = ['Technical', 'Behavioral', 'HR', 'Aptitude'];
    const categoryBreakdown = types.map((t) => {
      const matches = assessments.filter((a) => a.type === t);
      const count = matches.length;
      const avgScore = count > 0 ? Math.round(matches.reduce((sum, item) => sum + item.overallScore, 0) / count) : 0;
      return {
        type: t,
        count,
        avgScore,
      };
    });

    return {
      totalInterviews,
      averageScore,
      totalPracticeTimeMinutes,
      readinessLevel,
      radarMetrics,
      recentPerformance,
      categoryBreakdown,
    };
  },
};
