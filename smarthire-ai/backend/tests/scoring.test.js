const { computeOverallScore, ratingFor } = require('../src/services/scoring.service');

describe('computeOverallScore', () => {
  it('applies the documented weights (30/25/30/15)', () => {
    const score = computeOverallScore({
      communication: 100,
      confidence: 100,
      technical: 100,
      professionalism: 100,
    });
    expect(score).toBeCloseTo(100);
  });

  it('weights technical and communication most heavily', () => {
    const score = computeOverallScore({
      communication: 100,
      confidence: 0,
      technical: 100,
      professionalism: 0,
    });
    expect(score).toBeCloseTo(60); // 0.30 + 0.30
  });

  it('handles an all-zero submission', () => {
    const score = computeOverallScore({
      communication: 0,
      confidence: 0,
      technical: 0,
      professionalism: 0,
    });
    expect(score).toBe(0);
  });
});

describe('ratingFor', () => {
  it.each([
    [95, 'Excellent'],
    [80, 'Good'],
    [65, 'Average'],
    [45, 'Needs Improvement'],
    [20, 'Poor'],
  ])('rates a score of %i as %s', (score, expected) => {
    expect(ratingFor(score)).toBe(expected);
  });
});
