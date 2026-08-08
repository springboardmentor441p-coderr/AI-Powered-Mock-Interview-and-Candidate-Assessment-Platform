import { GoogleGenAI, Type } from '@google/genai';
import { InterviewConfig, InterviewQuestion, AssessmentResult, InterviewType, QuestionFeedback, QuestionAnswerMetadata } from '../../types';

export interface AiQuestionGenerationParams {
  type: InterviewType;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  domain: string;
  resumeSkills?: string[];
  questionCount: number;
  topics?: string[];
  includeCodeSnippet?: boolean;
}

export interface AiQuestionRawItem {
  question: string;
  questionType: string;
  difficulty: string;
  expectedTopics: string[];
  hint?: string;
}

export interface AiNextQuestionParams {
  type: InterviewType;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  domain: string;
  resumeSkills?: string[];
  questionNumber: number;
  totalQuestions: number;
  previousQaPairs?: Array<{ questionText: string; candidateAnswer: string }>;
  topics?: string[];
  includeCodeSnippet?: boolean;
}

export interface AiEvaluationParams {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  speechData?: Record<string, QuestionAnswerMetadata>;
  resumeSkills?: string[];
}

export interface AiEvaluationResponse {
  questionEvaluations: Array<{
    questionId: string;
    questionText: string;
    candidateAnswer: string;
    score: number;
    evaluation: string;
    improvementSuggestion: string;
    strengths?: string[];
    improvements?: string[];
  }>;
  categoryScores: {
    communication: number;
    confidence: number;
    technicalRelevance: number;
    professionalism: number;
  };
  summaryFeedback?: string;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  practiceRecommendations: string[];
}

class AiService {
  private aiInstance: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    if (!this.aiInstance) {
      this.aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.aiInstance;
  }

  public isAiAvailable(): boolean {
    return this.getClient() !== null;
  }

  /**
   * Helper to execute Gemini requests with model fallback and quota retry
   */
  private async generateWithModelFallback(
    client: GoogleGenAI,
    requestParams: { contents: any; config?: any }
  ): Promise<any> {
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          ...requestParams,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.log(`[AiService] Gemini API notice on ${model}: ${msg.length > 100 ? msg.slice(0, 100) + '...' : msg}`);
      }
    }
    throw lastError;
  }

  /**
   * Real AI Question Generation via Gemini API
   */
  async generateQuestions(params: AiQuestionGenerationParams): Promise<InterviewQuestion[] | null> {
    const client = this.getClient();
    if (!client) {
      console.log('[AiService] Gemini API key not provided or placeholder. Falling back to local questions.');
      return null;
    }

    try {
      const skillsText = params.resumeSkills && params.resumeSkills.length > 0 
        ? params.resumeSkills.join(', ') 
        : 'Not specified';
      const topicsText = params.topics && params.topics.length > 0 
        ? params.topics.join(', ') 
        : 'General core concepts';

      const prompt = `You are a world-class senior interviewer preparing a live interview session.
Generate ${params.questionCount} interview questions for a ${params.difficulty} level candidate applying for the role of "${params.domain}".

Interview Type: ${params.type} (Must be strictly ${params.type}-oriented)
Target Role/Domain: ${params.domain}
Seniority Difficulty: ${params.difficulty}
Target Focus Topics: ${topicsText}
Candidate Resume Skills: ${skillsText}

Instructions:
1. Generate exactly ${params.questionCount} highly relevant, scenario-based interview questions tailored to ${params.type} evaluation.
2. Incorporate candidate's resume skills (${skillsText}) where relevant to make the interview personalized.
3. Provide expected topics and a concise, high-value hint for each question.
4. Ensure tone is professional and realistic for real-world hiring loops.`;

      const response = await this.generateWithModelFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'The interview question text' },
                questionType: { type: Type.STRING, description: 'Type of question (Technical, HR, Behavioral, Aptitude)' },
                difficulty: { type: Type.STRING, description: 'Difficulty level (Junior, Mid, Senior, Lead)' },
                expectedTopics: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: 'List of key topics or concepts expected in a strong answer' 
                },
                hint: { type: Type.STRING, description: 'A helpful hint or reminder for the candidate' }
              },
              required: ['question', 'questionType', 'difficulty', 'expectedTopics']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsedJson: AiQuestionRawItem[] = JSON.parse(responseText);

      // Validate AI response structure
      if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
        throw new Error('Invalid AI questions structure received');
      }

      const validatedQuestions: InterviewQuestion[] = parsedJson.slice(0, params.questionCount).map((item, idx) => {
        const questionText = item.question && item.question.trim().length > 0
          ? item.question.trim()
          : `Explain core concepts and architectural trade-offs in ${params.domain}.`;

        return {
          id: `q_ai_${Date.now()}_${idx + 1}`,
          questionNumber: idx + 1,
          category: params.type,
          questionText,
          hint: item.hint || (item.expectedTopics && item.expectedTopics.length > 0 ? `Focus on: ${item.expectedTopics.join(', ')}` : 'Provide specific real-world examples and trade-offs.'),
          sampleCodeSnippet: (params.includeCodeSnippet && params.type === 'Technical')
            ? `// Technical Reference Snippet for ${params.domain}\nfunction optimizeWorkload(input: unknown) {\n  // Implement scalable logic here\n}`
            : undefined,
          timeAllowedSeconds: params.type === 'HR' ? 120 : 180,
        };
      });

      return validatedQuestions;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.log('[AiService] Gemini API quota limit reached. Triggering local question engine fallback.');
      } else {
        console.warn('[AiService] AI Question Generation notice:', msg.length > 150 ? msg.slice(0, 150) + '...' : msg);
      }
      return null;
    }
  }

  /**
   * Generates a single next question based on interview context and candidate's previous responses
   */
  async generateNextQuestion(params: AiNextQuestionParams): Promise<InterviewQuestion | null> {
    const client = this.getClient();
    if (!client) {
      console.log('[AiService] Gemini API unavailable for next question generation.');
      return null;
    }

    try {
      const skillsText = params.resumeSkills && params.resumeSkills.length > 0
        ? params.resumeSkills.join(', ')
        : 'Not specified';

      let historyContext = 'None (This is the first question of the interview).';
      if (params.previousQaPairs && params.previousQaPairs.length > 0) {
        historyContext = params.previousQaPairs.map((pair, idx) => 
          `Q${idx + 1}: ${pair.questionText}\nCandidate Answer: ${pair.candidateAnswer || 'No response provided.'}`
        ).join('\n\n');
      }

      const prompt = `You are an expert AI interviewer conducting a live, interactive audio interview.
Target Role / Domain: ${params.domain}
Seniority Level: ${params.difficulty}
Interview Type: ${params.type}
Candidate Resume Skills: ${skillsText}

Interview Progress: Question ${params.questionNumber} of ${params.totalQuestions}

PREVIOUS INTERVIEW CONVERSATION HISTORY:
${historyContext}

INSTRUCTIONS:
1. Generate EXACTLY ONE follow-up or next interview question for Question #${params.questionNumber}.
2. If previous candidate answers exist, build upon their previous responses to create a realistic, conversational flow (e.g. asking them to clarify, elaborate on a technical detail, or move to the next logical topic).
3. The question MUST be natural when spoken aloud by an AI interviewer.
4. Keep the question text clear, concise, and focused.
5. Provide a list of expected topics and a concise hint.`;

      const response = await this.generateWithModelFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'The single interview question text' },
              questionType: { type: Type.STRING, description: 'Type of question' },
              difficulty: { type: Type.STRING, description: 'Difficulty level' },
              expectedTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key topics expected in response'
              },
              hint: { type: Type.STRING, description: 'A helpful hint for candidate' }
            },
            required: ['question', 'questionType', 'difficulty', 'expectedTopics']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error('Empty response from Gemini API');

      const item: AiQuestionRawItem = JSON.parse(responseText);
      const questionText = item.question && item.question.trim().length > 0
        ? item.question.trim()
        : `Could you elaborate on key architecture and performance considerations in ${params.domain}?`;

      return {
        id: `q_ai_live_${Date.now()}_${params.questionNumber}`,
        questionNumber: params.questionNumber,
        category: params.type,
        questionText,
        hint: item.hint || (item.expectedTopics && item.expectedTopics.length > 0 ? `Focus on: ${item.expectedTopics.join(', ')}` : 'Provide specific examples.'),
        sampleCodeSnippet: (params.includeCodeSnippet && params.type === 'Technical')
          ? `// Reference for Question ${params.questionNumber}\nfunction evaluateSolution() {\n  // Code context\n}`
          : undefined,
        timeAllowedSeconds: params.type === 'HR' ? 120 : 180,
        isAiGenerated: true,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.log('[AiService] Gemini API quota limit reached for next question.');
      } else {
        console.warn('[AiService] Next question notice:', msg.length > 150 ? msg.slice(0, 150) + '...' : msg);
      }
      return null;
    }
  }

  /**
   * Real AI Answer Evaluation via Gemini API
   */
  async evaluateInterview(params: AiEvaluationParams): Promise<AiEvaluationResponse | null> {
    const client = this.getClient();
    if (!client) {
      console.log('[AiService] Gemini API key not available. Falling back to local assessment.');
      return null;
    }

    try {
      const skillsText = params.resumeSkills && params.resumeSkills.length > 0
        ? params.resumeSkills.join(', ')
        : 'Not provided';

      const QA_Pairs = params.questions.map((q) => {
        const answer = params.answers[q.id] || params.answers[q.questionNumber?.toString()] || 'No response provided by candidate.';
        const speechMeta = params.speechData ? params.speechData[q.id] || params.speechData[q.questionNumber?.toString()] : undefined;
        return {
          questionId: q.id,
          questionText: q.questionText,
          candidateAnswer: answer,
          speechAnalysis: speechMeta?.speechMetrics ? {
            wordsPerMinute: speechMeta.speechMetrics.wordsPerMinute,
            fillerWordCount: speechMeta.speechMetrics.fillerWordCount,
            fillerWordPercentage: speechMeta.speechMetrics.fillerWordPercentage,
            fluencyScore: speechMeta.speechMetrics.fluencyScore,
            fluencyLabel: speechMeta.speechMetrics.fluencyLabel,
            grammarStatus: speechMeta.speechMetrics.grammarStatus,
          } : 'No speech recording analysis provided (Text Answer)',
        };
      });

      const prompt = `You are a Senior Engineering Director evaluating a completed mock interview.
Assess the candidate's answers comprehensively for the following setup:

Interview Type: ${params.config.type}
Target Domain/Role: ${params.config.targetRole}
Seniority Tier: ${params.config.experienceLevel}
Candidate Resume Skills: ${skillsText}

Questions and Candidate Responses:
${JSON.stringify(QA_Pairs, null, 2)}

Instructions:
1. Evaluate each individual answer on a 0 to 100 scale.
2. Calculate overall category scores (each strictly a number from 0 to 100) for:
   - communication (weight 30%): clarity, structure, articulation
   - confidence (weight 25%): assertiveness, conviction, direct phrasing
   - technicalRelevance (weight 30%): domain keyword density, architectural depth, accurate concepts
   - professionalism (weight 15%): formal delivery, completeness, engagement
3. Identify candidate strengths, weaknesses, actionable improvement suggestions, and practice recommendations.
4. Return valid JSON matching the exact output schema.`;

      const response = await this.generateWithModelFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionEvaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    questionText: { type: Type.STRING },
                    candidateAnswer: { type: Type.STRING },
                    score: { type: Type.NUMBER, description: 'Score from 0 to 100' },
                    evaluation: { type: Type.STRING, description: 'Feedback explanation for this answer' },
                    improvementSuggestion: { type: Type.STRING, description: 'Specific suggestion to improve this answer' },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['questionId', 'score', 'evaluation', 'improvementSuggestion']
                }
              },
              categoryScores: {
                type: Type.OBJECT,
                properties: {
                  communication: { type: Type.NUMBER, description: 'Score 0 to 100' },
                  confidence: { type: Type.NUMBER, description: 'Score 0 to 100' },
                  technicalRelevance: { type: Type.NUMBER, description: 'Score 0 to 100' },
                  professionalism: { type: Type.NUMBER, description: 'Score 0 to 100' }
                },
                required: ['communication', 'confidence', 'technicalRelevance', 'professionalism']
              },
              summaryFeedback: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              practiceRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: [
              'questionEvaluations',
              'categoryScores',
              'strengths',
              'weaknesses',
              'improvementSuggestions',
              'practiceRecommendations'
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini evaluation model');
      }

      const parsed: AiEvaluationResponse = JSON.parse(responseText);

      // Sanitize and validate category scores (Must be numbers 0-100)
      const sanitizeScore = (val: any, fallback = 75): number => {
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(num)) return fallback;
        return Math.min(100, Math.max(0, Math.round(num)));
      };

      const categoryScores = {
        communication: sanitizeScore(parsed.categoryScores?.communication, 80),
        confidence: sanitizeScore(parsed.categoryScores?.confidence, 78),
        technicalRelevance: sanitizeScore(parsed.categoryScores?.technicalRelevance, 82),
        professionalism: sanitizeScore(parsed.categoryScores?.professionalism, 85),
      };

      const questionEvaluations = Array.isArray(parsed.questionEvaluations)
        ? parsed.questionEvaluations.map((qe, idx) => {
            const origQ = params.questions[idx] || params.questions.find(q => q.id === qe.questionId);
            return {
              questionId: qe.questionId || origQ?.id || `q_${idx + 1}`,
              questionText: qe.questionText || origQ?.questionText || '',
              candidateAnswer: qe.candidateAnswer || params.answers[qe.questionId] || 'No answer provided.',
              score: sanitizeScore(qe.score, 75),
              evaluation: qe.evaluation || 'Answer evaluated with clear technical concepts.',
              improvementSuggestion: qe.improvementSuggestion || 'Include concrete metrics or architectural examples.',
              strengths: Array.isArray(qe.strengths) ? qe.strengths : ['Answered main question requirements'],
              improvements: Array.isArray(qe.improvements) ? qe.improvements : ['Provide deeper impact metrics'],
            };
          })
        : [];

      return {
        questionEvaluations,
        categoryScores,
        summaryFeedback: parsed.summaryFeedback || `AI-evaluated ${params.config.type} interview for ${params.config.targetRole}.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Demonstrated relevant domain knowledge'],
        weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ['Include more specific quantitative impact metrics'],
        improvementSuggestions: Array.isArray(parsed.improvementSuggestions) && parsed.improvementSuggestions.length > 0 ? parsed.improvementSuggestions : ['Use the STAR framework for behavioral responses'],
        practiceRecommendations: Array.isArray(parsed.practiceRecommendations) && parsed.practiceRecommendations.length > 0 ? parsed.practiceRecommendations : ['System Architecture & Scalability'],
      };
    } catch (err: any) {
      console.warn('[AiService] AI Answer Evaluation failed. Falling back to local evaluator:', err.message || err);
      return null;
    }
  }
}

export const aiService = new AiService();
