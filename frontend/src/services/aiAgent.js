/**
 * MiraAgent - Autonomous Real-Time AI Interviewer Agent
 * Handles natural speech generation, adaptive topic extraction, context-aware follow-up prompts,
 * and candidate performance evaluation.
 */
class MiraAgent {
  constructor(agentName = "Mira") {
    this.name = agentName;
    this.role = "Senior AI Technical Interviewer";
    this.currentUtterance = null; // Module/instance ref to prevent Chrome garbage collection of active speech
  }

  /**
   * Speak the prompt aloud using natural Web Speech Synthesis
   */
  speak(text, onStartCallback, onEndCallback) {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn(`[${this.name}] Speech synthesis (window.speechSynthesis) is not supported in this browser.`);
        if (onEndCallback) onEndCallback();
        return;
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.cancel(); // Clear any previous queued speech
      this.currentUtterance = null;

      const cleanText = (text || '').replace(/<[^>]*>?/gm, '').trim();
      if (!cleanText) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // Create utterance and store in class instance reference to prevent V8 garbage collection
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';

      const performSpeak = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const femaleOrEnVoice = voices.find(v => 
              (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Female") || v.name.includes("US English")) && 
              v.lang.startsWith("en")
            ) || voices.find(v => v.lang.startsWith("en"));

            if (femaleOrEnVoice) {
              utterance.voice = femaleOrEnVoice;
            }
          }

          utterance.onstart = () => {
            console.log(`[${this.name}] Started speaking question aloud: "${cleanText.substring(0, 40)}..."`);
            if (onStartCallback) onStartCallback();
          };

          utterance.onend = () => {
            console.log(`[${this.name}] Finished speaking question.`);
            this.currentUtterance = null;
            if (onEndCallback) onEndCallback();
          };

          utterance.onerror = (e) => {
            console.warn(`[${this.name}] SpeechUtterance error:`, e.error, e);
            this.currentUtterance = null;
            if (onEndCallback) onEndCallback();
          };

          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 50);
        } catch (e) {
          console.warn(`[${this.name}] Error setting voice:`, e);
          window.speechSynthesis.speak(utterance);
        }
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        performSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          performSpeak();
        };
        setTimeout(() => {
          if (this.currentUtterance === utterance) {
            performSpeak();
          }
        }, 300);
      }
    } catch (err) {
      console.warn(`[${this.name}] Speech synthesis error:`, err);
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    }
  }

  /**
   * Stop any active speech output
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
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

    if (lower.includes("introduce") || lower.includes("experience") || lower.includes("background") || lower.includes("engineer") || lower.includes("developer") || lower.includes("working")) {
      return `Thank you for introducing yourself! Building on your background and experience, let's start with our first technical discussion: ${qText}`;
    }

    if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("ml") || lower.includes("data science")) {
      return `Great to hear about your experience in AI and Machine Learning! Building on what you just shared: ${qText}`;
    }
    
    if (lower.includes("python") || lower.includes("script") || lower.includes("code")) {
      return `Nice! Since you mentioned your background writing Python code, let me ask: ${qText}`;
    }

    if (lower.includes("web") || lower.includes("api") || lower.includes("backend") || lower.includes("fastapi")) {
      return `Awesome! Given your experience building backend web applications and APIs: ${qText}`;
    }

    if (lower.includes("database") || lower.includes("sql") || lower.includes("postgres") || lower.includes("queries")) {
      return `That's very relevant experience with databases! Following up on what you mentioned: ${qText}`;
    }

    return `Thank you for sharing that! Building on your answer: ${qText}`;
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
