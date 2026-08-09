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
    const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
    const lowerText = text.toLowerCase();
    
    totalDuration += input.audioDurationSeconds || 30;

    // 1. Technical Accuracy & Key Points Coverage
    let keyPointsMatched = 0;
    const expectedPoints = input.question.expectedKeyPoints || [];
    
    expectedPoints.forEach((point) => {
      // Check if key words from point exist in candidate response
      const keywords = point.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matched = keywords.some(kw => lowerText.includes(kw));
      if (matched) keyPointsMatched++;
    });

    const keyPointRatio = expectedPoints.length > 0 ? keyPointsMatched / expectedPoints.length : 0.5;
    
    // Technical Accuracy Score (0-100)
    let techAccuracy = Math.min(100, Math.max(25, Math.round(keyPointRatio * 75 + (wordCount > 30 ? 25 : wordCount * 0.8))));

    // 2. Communication Fluency
    // Penalize filler words ("um", "uh", "like", "you know", "basically")
    const fillerMatches = (lowerText.match(/\b(um|uh|like|you know|basically|so yeah)\b/g) || []).length;
    const fillerDensity = wordCount > 0 ? fillerMatches / wordCount : 0;
    
    let commFluency = Math.min(100, Math.max(30, Math.round(
      (wordCount >= 20 ? 80 : wordCount * 4) - (fillerDensity * 150)
    )));

    // 3. Problem Solving & Structural Depth
    // Checks for structural signals like "because", "for example", "firstly", "architect", "scale", "solution"
    const structuralKeywords = ['first', 'second', 'because', 'example', 'however', 'result', 'approach', 'tradeoff', 'architecture', 'optimi'];
    const structureHits = structuralKeywords.filter(k => lowerText.includes(k)).length;
    
    let problemSolving = Math.min(100, Math.max(30, Math.round(
      50 + (structureHits * 10) + (wordCount > 40 ? 20 : 0)
    )));

    // 4. Body Language & Confidence
    const eyeContact = input.speechMetrics?.eyeContactPercent ?? 78;
    const confidenceInput = input.speechMetrics?.confidenceScore ?? 75;
    const proctorWarningCount = proctoringEvents.length;

    let bodyLangConfidence = Math.min(100, Math.max(20, Math.round(
      (confidenceInput * 0.5) + (eyeContact * 0.4) - (proctorWarningCount * 5)
    )));

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

    return {
      questionId: input.question.id,
      questionText: input.question.text,
      topic: input.question.topic,
      candidateResponse: text || 'No response provided.',
      audioDurationSeconds: input.audioDurationSeconds || 30,
      score: qScore,
      technicalAccuracy: techAccuracy,
      communicationFluency: commFluency,
      problemSolvingDepth: problemSolving,
      bodyLanguageConfidence: bodyLangConfidence,
      aiFeedback: qScore >= 80 
        ? `Strong candidate response demonstrating thorough understanding of ${input.question.topic}.`
        : qScore >= 60
        ? `Satisfactory response covering core principles of ${input.question.topic}, though greater technical specificity is recommended.`
        : `Answer lacked technical depth on ${input.question.topic}. Consider anchoring with concrete examples and architectural details.`,
      strengths: answerStrengths.length > 0 ? answerStrengths : ['Completed response within allocated time.'],
      areasToImprove: answerAreasToImprove.length > 0 ? answerAreasToImprove : ['Incorporate more quantitative outcomes from past experience.'],
      idealAnswerComparison: `${Math.round(keyPointRatio * 100)}% alignment with target staff engineer key points.`
    };
  });

  const questionCount = Math.max(1, processedAnswers.length);
  const avgTech = Math.round(totalTechnicalAccuracy / questionCount);
  const avgComm = Math.round(totalCommunicationFluency / questionCount);
  const avgProb = Math.round(totalProblemSolvingDepth / questionCount);
  const avgBody = Math.round(totalBodyLanguageConfidence / questionCount);
  
  // Delivery & Pacing calculation
  const totalWords = rawInputs.reduce((sum, i) => sum + (i.candidateResponseText.trim().split(/\s+/).filter(Boolean).length), 0);
  const totalMinutes = Math.max(0.5, totalDuration / 60);
  const calculatedWpm = Math.round(totalWords / totalMinutes);
  
  // Ideal WPM range is 120 - 160 WPM
  let deliveryPacingScore = 85;
  if (calculatedWpm > 0 && (calculatedWpm < 100 || calculatedWpm > 180)) {
    deliveryPacingScore = 65;
  } else if (calculatedWpm >= 120 && calculatedWpm <= 160) {
    deliveryPacingScore = 95;
  }

  // Calculate Overall Score (weighted sum)
  const overallScore = Math.round(
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
  if (avgTech >= 75) {
    globalStrengths.push(`Demonstrated solid domain expertise in ${config.track} principles and key technical topics.`);
  } else {
    globalStrengths.push(`Completed all ${processedAnswers.length} interview questions, showing persistence and structure.`);
  }
  if (avgComm >= 75) {
    globalStrengths.push('Articulate communication with clear problem breakdown.');
  }
  if (avgBody >= 75) {
    globalStrengths.push('Maintained strong gaze stability and visual engagement throughout the recording session.');
  }

  // Dynamic Weaknesses / Areas to Improve
  const globalWeaknesses: string[] = [];
  if (avgTech < 70) {
    globalWeaknesses.push(`Technical knowledge score needs improvement (${avgTech}/100) on core ${config.track} topics.`);
  }
  if (avgComm < 70) {
    globalWeaknesses.push('Frequent use of filler words or brief responses reduces presentation clarity.');
  }
  if (proctoringEvents.length > 0) {
    globalWeaknesses.push(`Proctoring system flagged ${proctoringEvents.length} gaze/window violation(s) during session.`);
  }
  if (globalWeaknesses.length === 0) {
    globalWeaknesses.push('Slight hesitation when discussing edge-case failure modes under pressure.');
  }

  // Dynamic Recommended Improvements / Suggestions
  const globalSuggestions: string[] = [];
  if (avgTech < 75) {
    globalSuggestions.push('Anchor answers in specific framework mechanisms, code examples, and quantifiable project metrics.');
  }
  if (avgComm < 75) {
    globalSuggestions.push('Practice pausing silently instead of using filler words when formulating complex thoughts.');
  }
  globalSuggestions.push('Review system scaling trade-offs and edge failure handling prior to high-stakes interviews.');

  const reportId = `rpt-${Date.now()}`;

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

export function createCandidateApplicationFromReport(report: EvaluationReport): CandidateApplication {
  let recommendation: CandidateApplication['recommendation'] = 'Needs Review';
  if (report.overallScore >= 85) recommendation = 'Strong Hire';
  else if (report.overallScore >= 70) recommendation = 'Shortlist';
  else if (report.overallScore < 50) recommendation = 'Reject';

  return {
    id: `app-${Date.now()}`,
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
