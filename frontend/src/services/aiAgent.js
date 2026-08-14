/**
 * NexusAIAgent - Autonomous Real-Time AI Interviewer Agent
 * Handles natural speech generation, adaptive topic extraction, context-aware follow-up prompts,
 * and candidate performance scoring.
 */
class NexusAIAgent {
  constructor(agentName = "Nexus AI Agent") {
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
   * Generate an adaptive follow-up prompt based on what topic the candidate just spoke.
   * Handles graceful skip if candidate didn't speak.
   */
  generateAdaptivePrompt(spokenText, nextQuestionObj) {
    if (!spokenText || spokenText.trim().length === 0) {
      return `Okay, I will continue with the next question! ${nextQuestionObj.question_text}`;
    }

    const lower = spokenText.toLowerCase();

    if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("ml") || lower.includes("data science")) {
      return `Great to hear about your passion for AI and Machine Learning! Building on what you just shared: ${nextQuestionObj.question_text}`;
    }
    
    if (lower.includes("python") || lower.includes("script") || lower.includes("code")) {
      return `Nice! Since you mentioned your strong experience writing Python code, let's explore this next concept: ${nextQuestionObj.question_text}`;
    }

    if (lower.includes("web") || lower.includes("api") || lower.includes("backend") || lower.includes("fastapi")) {
      return `Awesome! Given your background building backend web applications and APIs, here is our next question: ${nextQuestionObj.question_text}`;
    }

    if (lower.includes("list") || lower.includes("tuple") || lower.includes("dictionary") || lower.includes("array")) {
      return `That's a very clear explanation of data structures! Following up on what you just mentioned: ${nextQuestionObj.question_text}`;
    }

    return `That's a solid explanation! Building on your answer: ${nextQuestionObj.question_text}`;
  }

  /**
   * Calculate dynamic performance evaluation for completed candidate session
   */
  evaluateCandidateSession(answersList, telemetryMetrics) {
    const answeredCount = answersList.filter(a => a.is_answered).length;
    const totalWords = answersList.reduce((acc, curr) => acc + (curr.is_answered ? curr.user_answer.split(' ').length : 0), 0);
    
    let score = 50.0;
    if (answeredCount === 0) {
      score = 45.0;
    } else {
      const completionPct = (answeredCount / 5) * 50;
      const depthPct = Math.min(30, (totalWords / 5) * 1.5);
      const visionPct = ((telemetryMetrics?.eyeContactPct || 90) / 100) * 20;
      score = Math.min(98.5, Math.max(45.0, Math.round(completionPct + depthPct + visionPct)));
    }

    let rating = "Needs Technical Refinement";
    if (score >= 90) rating = "Outstanding Candidate (Strong Hire)";
    else if (score >= 80) rating = "Recommended Candidate (Good Hire)";
    else if (score >= 65) rating = "Passable - Needs Practice";
    else rating = "Unsatisfactory - Unanswered Questions Detected";

    return { score, rating, answeredCount };
  }
}

// Export singleton instance of the AI Agent
export const nexusAgent = new NexusAIAgent("Nexus AI Agent");
export default NexusAIAgent;
