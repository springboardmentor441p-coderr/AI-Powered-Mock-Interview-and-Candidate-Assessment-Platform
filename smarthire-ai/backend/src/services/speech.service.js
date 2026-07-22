const OpenAI = require('openai');
const fs = require('fs');

let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * Transcribes an audio file using OpenAI Whisper API
 */
async function transcribeAudio(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const response = await getClient().audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });
    return response.text;
  } catch (error) {
    console.error('[speech.service] Transcription error:', error.message);
    return '';
  }
}

/**
 * Analyzes the transcript to compute speech metrics
 * Returns { fillerWordCount, paceWpm, grammarScore }
 */
function analyzeSpeechMetrics(transcript, audioDurationSec) {
  if (!transcript) return { fillerWordCount: 0, paceWpm: 0, grammarScore: 0 };

  const words = transcript.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // 1. Calculate WPM
  let paceWpm = 0;
  if (audioDurationSec && audioDurationSec > 0) {
    const minutes = audioDurationSec / 60;
    paceWpm = Math.round(wordCount / minutes);
  } else {
     // default fallback if duration isn't available
     paceWpm = 130;
  }

  // 2. Filler words detection
  const fillerWordsList = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'so'];
  const lowerTranscript = transcript.toLowerCase();
  
  let fillerWordCount = 0;
  fillerWordsList.forEach((filler) => {
    // regex to match exact filler words (boundaries)
    const regex = new RegExp(`\\b${filler}\\b`, 'g');
    const matches = lowerTranscript.match(regex);
    if (matches) fillerWordCount += matches.length;
  });

  // 3. Grammar score (Heuristic for now without an extra LLM call to save time/cost)
  // Penalize repetitive words or extremely short sentences
  let grammarScore = 85; 
  if (wordCount < 10) grammarScore -= 20;
  if (fillerWordCount > wordCount * 0.1) grammarScore -= 10;
  
  return {
    fillerWordCount,
    paceWpm,
    grammarScore: Math.max(0, Math.min(100, grammarScore))
  };
}

module.exports = { transcribeAudio, analyzeSpeechMetrics };
