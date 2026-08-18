/**
 * MiraAgent - Autonomous Real-Time AI Interviewer Agent
 * Handles natural speech generation, adaptive topic extraction, context-aware follow-up prompts,
 * and candidate performance evaluation.
 */
class MiraAgent {
  constructor(agentName = "Mira") {
    this.name = agentName;
    this.role = "Senior AI Technical Interviewer";
  }

  /**
   * Speak the prompt aloud using natural Web Speech Synthesis
   */
  speak(text, onStartCallback, onEndCallback) {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        if (onStartCallback) utterance.onstart = onStartCallback;
        if (onEndCallback) utterance.onend = onEndCallback;
        utterance.onerror = () => {
          if (onEndCallback) onEndCallback();
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn(`[${this.name}] Speech synthesis error:`, err);
    }
  }

  /**
   * Stop any active speech output
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Generate an adaptive follow-up prompt based on candidate's response.
   */
  generateAdaptivePrompt(spokenText, nextQuestionObj) {
    const qText = nextQuestionObj?.question_text || nextQuestionObj?.q || "";

    if (!spokenText || spokenText.trim().length === 0 || spokenText.trim() === "Not answered") {
      return `Okay, let's move on to the next question. ${qText}`;
    }

    const lower = spokenText.toLowerCase();

    if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("ml") || lower.includes("data science")) {
      return `Great to hear about your experience in AI and Machine Learning! Building on what you just shared: ${qText}`;
    }
    
    if (lower.includes("python") || lower.includes("script") || lower.includes("code")) {
      return `Nice! Since you mentioned your background writing Python code, let's explore this next topic: ${qText}`;
    }

    if (lower.includes("web") || lower.includes("api") || lower.includes("backend") || lower.includes("fastapi")) {
      return `Awesome! Given your experience building backend web applications and APIs: ${qText}`;
    }

    if (lower.includes("list") || lower.includes("tuple") || lower.includes("dictionary") || lower.includes("array")) {
      return `That's a very clear explanation of core concepts! Following up on what you just mentioned: ${qText}`;
    }

    return `Thank you for that response! Building on your answer: ${qText}`;
  }

  /**
   * Calculate dynamic performance evaluation for completed candidate session
   */
  evaluateCandidateSession(answersList, telemetryMetrics) {
    const answeredCount = answersList.filter(a => a.is_answered).length;
    const totalWords = answersList.reduce((acc, curr) => acc + (curr.is_answered ? curr.user_answer.split(' ').length : 0), 0);
    
    let score = 0.0;
    if (answeredCount === 0) {
      score = 0.0;
    } else {
      const completionPct = (answeredCount / 5) * 50;
      const depthPct = Math.min(30, (totalWords / 5) * 1.5);
      const visionPct = ((telemetryMetrics?.eyeContactPct || 0) / 100) * 20;
      score = Math.min(100.0, Math.max(0.0, Math.round(completionPct + depthPct + visionPct)));
    }

    let rating = "Needs Practice";
    if (score >= 90) rating = "Outstanding Candidate (Strong Hire)";
    else if (score >= 80) rating = "Recommended Candidate (Good Hire)";
    else if (score >= 60) rating = "Passable - Needs Technical Depth";
    else rating = "Unsatisfactory - Unanswered Questions";

    return { score, rating, answeredCount };
  }
}

// Export singleton instance of Mira AI Agent
export const miraAgent = new MiraAgent("Mira");
export default MiraAgent;
