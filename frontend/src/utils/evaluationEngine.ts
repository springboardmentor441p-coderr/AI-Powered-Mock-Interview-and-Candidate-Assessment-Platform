import { 
  InterviewConfig, 
  EvaluationReport, 
  AnswerRecord, 
  ProctoringEvent,
  Question,
  CandidateApplication
} from '../types';

export interface CandidateRawInput {
  question: Question;
  candidateResponseText: string;
  audioDurationSeconds: number;
  speechMetrics?: {
    wpm?: number;
    fillerWordCount?: number;
    eyeContactPercent?: number;
    confidenceScore?: number;
  };
}

export function evaluateInterview(
  config: InterviewConfig,
  rawInputs: CandidateRawInput[],
  proctoringEvents: ProctoringEvent[],
  candidateName: string,
  candidateEmail: string
): EvaluationReport {
  let totalTechnicalAccuracy = 0;
  let totalCommunicationFluency = 0;
  let totalProblemSolvingDepth = 0;
  let totalBodyLanguageConfidence = 0;
  let totalDuration = 0;

  const processedAnswers: AnswerRecord[] = rawInputs.map((input) => {
    const text = input.candidateResponseText.trim();
    const isUnanswered = !text || text === 'No response provided.' || text === 'No explicit verbal answer provided.';
    
    const wordCount = isUnanswered ? 0 : text.split(/\s+/).filter(Boolean).length;
    const lowerText = isUnanswered ? '' : text.toLowerCase();
    
    totalDuration += input.audioDurationSeconds || 30;

    let techAccuracy = 0;
    let commFluency = 0;
    let problemSolving = 0;
    let bodyLangConfidence = 0;
    let keyPointRatio = 0;
    let fillerMatches = 0;

    if (!isUnanswered && wordCount > 0) {
      // 1. Technical Accuracy & Key Points Coverage
      let keyPointsMatched = 0;
      const expectedPoints = input.question.expectedKeyPoints || [];
      
      expectedPoints.forEach((point) => {
        const keywords = point.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matched = keywords.some(kw => lowerText.includes(kw));
        if (matched) keyPointsMatched++;
      });

      keyPointRatio = expectedPoints.length > 0 ? keyPointsMatched / expectedPoints.length : 0.5;
      
      // Technical Accuracy Score (0-100) based on actual content
      techAccuracy = Math.min(100, Math.round(keyPointRatio * 75 + (wordCount > 30 ? 25 : wordCount * 0.8)));

      // 2. Communication Fluency
      fillerMatches = (lowerText.match(/\b(um|uh|like|you know|basically|so yeah)\b/g) || []).length;
      const fillerDensity = wordCount > 0 ? fillerMatches / wordCount : 0;
      
      commFluency = Math.min(100, Math.max(10, Math.round(
        (wordCount >= 20 ? 80 : wordCount * 4) - (fillerDensity * 150)
      )));

      // 3. Problem Solving & Structural Depth
      const structuralKeywords = ['first', 'second', 'because', 'example', 'however', 'result', 'approach', 'tradeoff', 'architecture', 'optimi'];
      const structureHits = structuralKeywords.filter(k => lowerText.includes(k)).length;
      
      problemSolving = Math.min(100, Math.max(10, Math.round(
        (structureHits * 15) + (wordCount > 30 ? 40 : wordCount * 1.2)
      )));

      // 4. Body Language & Confidence
      const eyeContact = input.speechMetrics?.eyeContactPercent ?? 78;
      const confidenceInput = input.speechMetrics?.confidenceScore ?? 75;
      const proctorWarningCount = proctoringEvents.length;

      bodyLangConfidence = Math.min(100, Math.max(20, Math.round(
        (confidenceInput * 0.5) + (eyeContact * 0.4) - (proctorWarningCount * 5)
      )));
    }

    // Overall Question Score
    const qScore = Math.round(
      (techAccuracy * 0.4) + (commFluency * 0.25) + (problemSolving * 0.2) + (bodyLangConfidence * 0.15)
    );

    totalTechnicalAccuracy += techAccuracy;
    totalCommunicationFluency += commFluency;
    totalProblemSolvingDepth += problemSolving;
    totalBodyLanguageConfidence += bodyLangConfidence;

    // Formulate answer-specific strengths and areas to improve
    const answerStrengths: string[] = [];
    const answerAreasToImprove: string[] = [];

    if (isUnanswered) {
      answerAreasToImprove.push(`No response provided for ${input.question.topic}.`);
    } else {
      if (techAccuracy >= 75) {
        answerStrengths.push(`Addressed core concept requirements effectively (${Math.round(keyPointRatio * 100)}% key points matched).`);
      } else {
        answerAreasToImprove.push(`Missed key technical depth on ${input.question.topic}.`);
      }

      if (commFluency >= 75) {
        answerStrengths.push('Articulate and clear sentence structure.');
      } else if (fillerMatches > 2) {
        answerAreasToImprove.push(`Noticed ${fillerMatches} filler word usage(s) ('um', 'uh', 'like').`);
      }
    }

    return {
      questionId: input.question.id,
      questionText: input.question.text,
      topic: input.question.topic,
      candidateResponse: isUnanswered ? 'No response provided.' : text,
      audioDurationSeconds: input.audioDurationSeconds || 30,
      score: qScore,
      technicalAccuracy: techAccuracy,
      communicationFluency: commFluency,
      problemSolvingDepth: problemSolving,
      bodyLanguageConfidence: bodyLangConfidence,
      aiFeedback: isUnanswered
        ? `No verbal or written answer was submitted for ${input.question.topic}.`
        : qScore >= 80 
        ? `Strong candidate response demonstrating thorough understanding of ${input.question.topic}.`
        : qScore >= 60
        ? `Satisfactory response covering core principles of ${input.question.topic}, though greater technical specificity is recommended.`
        : `Answer lacked technical depth on ${input.question.topic}. Consider anchoring with concrete examples and architectural details.`,
      strengths: answerStrengths.length > 0 ? answerStrengths : ['Session logged for question.'],
      areasToImprove: answerAreasToImprove.length > 0 ? answerAreasToImprove : ['Provide concrete technical explanations and code examples.'],
      idealAnswerComparison: isUnanswered ? '0% alignment (No answer provided)' : `${Math.round(keyPointRatio * 100)}% alignment with target staff engineer key points.`
    };
  });

  const questionCount = Math.max(1, processedAnswers.length);
  const avgTech = Math.round(totalTechnicalAccuracy / questionCount);
  const avgComm = Math.round(totalCommunicationFluency / questionCount);
  const avgProb = Math.round(totalProblemSolvingDepth / questionCount);
  const avgBody = Math.round(totalBodyLanguageConfidence / questionCount);
  
  // Delivery & Pacing calculation
  const totalWords = rawInputs.reduce((sum, i) => {
    const txt = i.candidateResponseText.trim();
    if (!txt || txt === 'No response provided.' || txt === 'No explicit verbal answer provided.') return sum;
    return sum + txt.split(/\s+/).filter(Boolean).length;
  }, 0);

  let deliveryPacingScore = 0;
  if (totalWords > 0) {
    const totalMinutes = Math.max(0.5, totalDuration / 60);
    const calculatedWpm = Math.round(totalWords / totalMinutes);
    if (calculatedWpm < 80 || calculatedWpm > 180) {
      deliveryPacingScore = 50;
    } else if (calculatedWpm >= 120 && calculatedWpm <= 160) {
      deliveryPacingScore = 95;
    } else {
      deliveryPacingScore = 75;
    }
  }

  // Calculate Overall Score (weighted sum)
  const overallScore = totalWords === 0 ? 0 : Math.round(
    (avgTech * 0.35) + 
    (avgComm * 0.25) + 
    (avgProb * 0.20) + 
    (avgBody * 0.10) + 
    (deliveryPacingScore * 0.10)
  );

  // Readiness Rating & Recommendation
  let readinessRating = 'Needs Improvement';
  if (overallScore >= 85) readinessRating = 'Senior Engineer Ready';
  else if (overallScore >= 70) readinessRating = 'Competent Candidate';
  else if (overallScore >= 55) readinessRating = 'Assessment Pending';

  // Dynamic Strengths based on candidate performance
  const globalStrengths: string[] = [];
  if (totalWords === 0) {
    globalStrengths.push('Session completed and logged.');
  } else {
    if (avgTech >= 75) {
      globalStrengths.push(`Demonstrated solid domain expertise in ${config.track} principles and key technical topics.`);
    }
    if (avgComm >= 75) {
      globalStrengths.push('Articulate communication with clear problem breakdown.');
    }
    if (avgBody >= 75) {
      globalStrengths.push('Maintained strong gaze stability and visual engagement throughout the recording session.');
    }
    if (globalStrengths.length === 0) {
      globalStrengths.push(`Submitted responses for ${processedAnswers.filter(a => a.candidateResponse !== 'No response provided.').length} of ${processedAnswers.length} interview questions.`);
    }
  }

  // Dynamic Weaknesses / Areas to Improve
  const globalWeaknesses: string[] = [];
  if (totalWords === 0) {
    globalWeaknesses.push('No verbal or written responses were provided for evaluation during the interview.');
  } else {
    if (avgTech < 70) {
      globalWeaknesses.push(`Technical knowledge score needs improvement (${avgTech}/100) on core ${config.track} topics.`);
    }
    if (avgComm < 70) {
      globalWeaknesses.push('Brief or incomplete answers reduced communication score.');
    }
    if (proctoringEvents.length > 0) {
      globalWeaknesses.push(`Proctoring system flagged ${proctoringEvents.length} gaze/window violation(s) during session.`);
    }
  }

  // Dynamic Recommended Improvements / Suggestions
  const globalSuggestions: string[] = [];
  if (totalWords === 0) {
    globalSuggestions.push('Ensure your microphone is enabled or type your answers into the input box before submitting each question.');
    globalSuggestions.push('Provide clear, structured explanations covering system design, trade-offs, and examples.');
  } else {
    if (avgTech < 75) {
      globalSuggestions.push('Anchor answers in specific framework mechanisms, code examples, and quantifiable project metrics.');
    }
    if (avgComm < 75) {
      globalSuggestions.push('Practice pausing silently instead of using filler words when formulating complex thoughts.');
    }
    globalSuggestions.push('Review system scaling trade-offs and edge failure handling prior to high-stakes interviews.');
  }

  const reportId = createUniqueEntityId('rpt');

  return {
    id: reportId,
    config,
    createdAt: new Date().toISOString(),
    candidateName,
    candidateEmail,
    overallScore,
    readinessRating,
    categoryScores: {
      technicalKnowledge: avgTech,
      communicationSkills: avgComm,
      behavioralSkills: avgProb,
      bodyLanguage: avgBody,
      deliveryAndPacing: deliveryPacingScore
    },
    answers: processedAnswers,
    proctoringEvents,
    strengths: globalStrengths,
    weaknesses: globalWeaknesses,
    recommendedImprovements: globalSuggestions,
    learningResources: [
      { title: `Mastering ${config.track} Architecture & System Design`, url: 'https://developer.mozilla.org', category: config.track },
      { title: 'Effective Engineering Communication & STAR Method', url: 'https://martinfowler.com', category: 'Behavioral' }
    ],
    videoRecordingAvailable: true,
    totalDurationSeconds: Math.round(totalDuration)
  };
}

function createUniqueEntityId(prefix: string): string {
  const stamp = Date.now();
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${stamp}-${randomPart}`;
}

export function createCandidateApplicationFromReport(report: EvaluationReport): CandidateApplication {
  let recommendation: CandidateApplication['recommendation'] = 'Needs Review';
  if (report.overallScore >= 85) recommendation = 'Strong Hire';
  else if (report.overallScore >= 70) recommendation = 'Shortlist';
  else if (report.overallScore < 50) recommendation = 'Reject';

  return {
    id: createUniqueEntityId('app'),
    candidateName: report.candidateName || 'Candidate User',
    candidateEmail: report.candidateEmail || 'candidate@intervio.ai',
    candidateAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(report.candidateName || 'Candidate')}&background=059669&color=fff`,
    jobCampaignTitle: `${report.config.title} (${report.config.track})`,
    appliedDate: new Date().toISOString().split('T')[0],
    overallScore: report.overallScore,
    technicalScore: report.categoryScores.technicalKnowledge,
    communicationScore: report.categoryScores.communicationSkills,
    behavioralScore: report.categoryScores.behavioralSkills,
    proctoringStatus: report.proctoringEvents.length === 0 ? 'Clean' : 'Minor Warnings',
    recommendation,
    reportId: report.id,
    resumeFileName: `${report.candidateName.replace(/\s+/g, '_')}_Resume.pdf`
  };
}
