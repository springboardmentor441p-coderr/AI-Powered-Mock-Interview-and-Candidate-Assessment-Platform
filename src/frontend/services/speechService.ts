import { SpeechMetrics } from '../../types';

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  durationSeconds: number;
  error?: string;
}

export class SpeechService {
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private startTime: number = 0;
  private durationTimer: any = null;

  constructor() {
    this.initRecognition();
  }

  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  public speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      const cleanText = text.replace(/[`*#_]/g, ''); // strip markdown formatting symbols
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.98; // slightly clear interview cadence
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis utterance error:', e);
        if (onError) onError();
        else if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis exception:', err);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  public isMicrophoneSupported(): boolean {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      } catch (err) {
        console.warn('Could not initialize SpeechRecognition:', err);
      }
    }
  }

  /**
   * Calculates real speech metrics from transcript and duration
   */
  public analyzeSpeech(transcript: string, durationSeconds: number): SpeechMetrics {
    const cleanText = transcript.trim();
    if (!cleanText) {
      return {
        durationSeconds: Math.round(durationSeconds),
        wordCount: 0,
        wordsPerMinute: 0,
        fillerWordCount: 0,
        fillerWordPercentage: 0,
        detectedFillerWords: [],
        fluencyScore: 0,
        fluencyLabel: 'No Audio Speech Detected',
        grammarStatus: 'Good',
        grammarDetails: 'No text available to evaluate grammar.',
        pronunciationStatus: 'Unavailable',
        speechAnalysisStatus: 'Empty',
      };
    }

    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationMin = Math.max(0.1, durationSeconds / 60);
    const wordsPerMinute = Math.round(wordCount / durationMin);

    // Filler word detection
    const fillerPatterns = [
      /\bum\b/gi,
      /\buh\b/gi,
      /\blike\b/gi,
      /\bbasically\b/gi,
      /\bactually\b/gi,
      /\byou know\b/gi,
      /\bsort of\b/gi,
      /\bkind of\b/gi,
      /\bi mean\b/gi,
    ];

    let fillerWordCount = 0;
    const detectedFillerMap: Record<string, number> = {};

    fillerPatterns.forEach((pattern) => {
      const matches = cleanText.match(pattern);
      if (matches) {
        fillerWordCount += matches.length;
        const normalized = matches[0].toLowerCase();
        detectedFillerMap[normalized] = (detectedFillerMap[normalized] || 0) + matches.length;
      }
    });

    const fillerWordPercentage = wordCount > 0 ? Math.round((fillerWordCount / wordCount) * 100) : 0;
    const detectedFillerWords = Object.keys(detectedFillerMap).map((w) => `${w} (${detectedFillerMap[w]})`);

    // Fluency Calculation
    let fluencyScore = 100;
    if (fillerWordPercentage > 12) fluencyScore -= 30;
    else if (fillerWordPercentage > 6) fluencyScore -= 18;
    else if (fillerWordPercentage > 2) fluencyScore -= 8;

    // Repeated adjacent words check (e.g. "the the", "I I")
    const repeatedMatches = cleanText.match(/\b(\w+)\s+\1\b/gi) || [];
    fluencyScore -= repeatedMatches.length * 5;

    // Pacing adjustments
    if (wordsPerMinute > 0 && wordsPerMinute < 85) fluencyScore -= 15;
    else if (wordsPerMinute > 210) fluencyScore -= 10;

    fluencyScore = Math.min(100, Math.max(20, fluencyScore));

    let fluencyLabel = 'High Fluency & Natural Cadence';
    if (fluencyScore < 60) fluencyLabel = 'Frequent Hesitations & High Filler Count';
    else if (fluencyScore < 80) fluencyLabel = 'Moderate Fluency with Brief Pauses';

    // Basic Grammar Heuristics
    const grammarIssues: string[] = [];

    // Check repeated words
    if (repeatedMatches.length > 0) {
      grammarIssues.push(`Repeated words detected: ${Array.from(new Set(repeatedMatches)).join(', ')}`);
    }

    // Check sentence capitalizations / missing punctuation in long responses
    if (wordCount > 30 && !/[.!?]/.test(cleanText)) {
      grammarIssues.push('Long spoken response lacking sentence breaks or punctuation.');
    }

    let grammarStatus: 'Good' | 'Minor Issues Detected' | 'Multiple Issues Detected' = 'Good';
    if (grammarIssues.length > 1) grammarStatus = 'Multiple Issues Detected';
    else if (grammarIssues.length === 1) grammarStatus = 'Minor Issues Detected';

    return {
      durationSeconds: Math.round(durationSeconds),
      wordCount,
      wordsPerMinute,
      fillerWordCount,
      fillerWordPercentage,
      detectedFillerWords,
      fluencyScore,
      fluencyLabel,
      grammarStatus,
      grammarDetails: grammarIssues.length > 0 ? grammarIssues.join(' ') : 'Good sentence structure and fluency coherence.',
      pronunciationStatus: 'Unavailable', // Standard browser STT does not expose phonetic pronunciation data
      speechAnalysisStatus: 'Analyzed',
    };
  }
}

export const speechService = new SpeechService();
