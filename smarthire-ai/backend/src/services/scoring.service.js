const WEIGHTS = {
  communication: 0.3,
  confidence: 0.25,
  technical: 0.3,
  professionalism: 0.15,
};

/**
 * Pure function: takes four 0-100 sub-scores, returns the weighted overall score.
 * This has no side effects and no external dependencies — keep it that way so it's
 * trivially unit-testable.
 */
function computeOverallScore({ communication, confidence, technical, professionalism }) {
  return (
    communication * WEIGHTS.communication +
    confidence * WEIGHTS.confidence +
    technical * WEIGHTS.technical +
    professionalism * WEIGHTS.professionalism
  );
}

function ratingFor(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Derives the Communication sub-score (0-100) from speech metrics collected
 * across a session's responses. Placeholder heuristic — refine once you have
 * real transcript/audio data to calibrate against.
 */
function computeCommunicationScore(responses) {
  if (!responses.length) return 0;
  const avgFillerPenalty = responses.reduce((sum, r) => {
    const fillerRatio = (r.speechMetrics?.fillerWordCount || 0) / 50; // rough normalization
    return sum + Math.min(fillerRatio, 1);
  }, 0) / responses.length;

  const avgGrammar = responses.reduce((sum, r) => sum + (r.speechMetrics?.grammarScore || 70), 0) / responses.length;

  const paceScore = responses.reduce((sum, r) => {
    const wpm = r.speechMetrics?.paceWpm || 130;
    const ideal = 130; // conversational ideal
    const deviation = Math.abs(wpm - ideal) / ideal;
    return sum + Math.max(0, 100 - deviation * 100);
  }, 0) / responses.length;

  const score = avgGrammar * 0.4 + paceScore * 0.3 + (1 - avgFillerPenalty) * 100 * 0.3;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Derives the Confidence sub-score (0-100) from visual metrics (eye contact,
 * engagement) collected across a session's responses.
 */
function computeConfidenceScore(responses) {
  if (!responses.length) return 0;
  const avgEyeContact = responses.reduce((sum, r) => sum + (r.visualMetrics?.eyeContactPct || 0), 0) / responses.length;
  const avgEngagement = responses.reduce((sum, r) => sum + (r.visualMetrics?.engagementScore || 0), 0) / responses.length;
  const score = avgEyeContact * 0.5 + avgEngagement * 0.5;
  return Math.round(Math.min(100, Math.max(0, score)));
}

module.exports = {
  computeOverallScore,
  ratingFor,
  computeCommunicationScore,
  computeConfidenceScore,
  WEIGHTS,
};
