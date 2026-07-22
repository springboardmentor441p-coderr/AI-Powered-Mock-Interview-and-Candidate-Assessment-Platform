const { analyzeSpeechMetrics } = require('../src/services/speech.service');

describe('analyzeSpeechMetrics', () => {
  it('returns zeros for empty transcript', () => {
    const result = analyzeSpeechMetrics('', 30);
    expect(result.fillerWordCount).toBe(0);
    expect(result.paceWpm).toBe(0);
    expect(result.grammarScore).toBe(0);
  });

  it('returns zeros for null transcript', () => {
    const result = analyzeSpeechMetrics(null, 30);
    expect(result.fillerWordCount).toBe(0);
    expect(result.paceWpm).toBe(0);
    expect(result.grammarScore).toBe(0);
  });

  it('calculates WPM correctly', () => {
    const text = 'I am a software developer with experience in building web applications';
    // 11 words in 30 seconds = 22 WPM
    const result = analyzeSpeechMetrics(text, 30);
    expect(result.paceWpm).toBe(22);
  });

  it('defaults to 130 WPM when duration is zero', () => {
    const text = 'Hello world this is a test';
    const result = analyzeSpeechMetrics(text, 0);
    expect(result.paceWpm).toBe(130);
  });

  it('detects filler words correctly', () => {
    const text = 'Um so I like basically wanted to um explain how I literally built this';
    const result = analyzeSpeechMetrics(text, 60);
    // "um" x2, "so" x1, "like" x1, "basically" x1, "literally" x1 = 6
    expect(result.fillerWordCount).toBe(6);
  });

  it('penalizes grammar score for very short transcripts', () => {
    const text = 'Yes okay';
    const result = analyzeSpeechMetrics(text, 5);
    // Short transcript gets -20 penalty from the base of 85
    expect(result.grammarScore).toBeLessThan(70);
  });

  it('penalizes grammar for high filler-word ratio', () => {
    // 5 words, 3 are filler => 60% filler ratio, well above 10%
    const text = 'um like basically yeah um';
    const result = analyzeSpeechMetrics(text, 10);
    expect(result.grammarScore).toBeLessThan(80);
  });

  it('clamps grammar score between 0 and 100', () => {
    const normalText = 'I have extensive experience in building scalable web applications using React and Node.js and I enjoy solving complex technical challenges.';
    const result = analyzeSpeechMetrics(normalText, 60);
    expect(result.grammarScore).toBeGreaterThanOrEqual(0);
    expect(result.grammarScore).toBeLessThanOrEqual(100);
  });
});
