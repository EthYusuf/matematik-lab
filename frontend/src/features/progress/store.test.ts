import { describe, expect, it } from 'vitest';
import { mastery, type SimProgress } from './store';

const base: SimProgress = {
  completedSteps: [],
  predictions: {},
  solvedChallenges: [],
  hintsUsed: {},
  totals: { steps: 5, challenges: 3 },
  updatedAt: 0,
};

describe('mastery', () => {
  it('hiç ilerleme yoksa 0', () => {
    expect(mastery(undefined)).toBe(0);
    expect(mastery(base)).toBe(0);
  });

  it('ders %40, görevler %60 ağırlıklıdır', () => {
    expect(mastery({ ...base, completedSteps: [0, 1, 2, 3, 4] })).toBeCloseTo(0.4, 10);
    expect(mastery({ ...base, solvedChallenges: ['a', 'b', 'c'] })).toBeCloseTo(0.6, 10);
    expect(mastery({ ...base, completedSteps: [0, 1, 2, 3, 4], solvedChallenges: ['a', 'b', 'c'] })).toBe(1);
  });
});
