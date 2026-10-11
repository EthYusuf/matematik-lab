import { describe, expect, it } from 'vitest';
import { DEFAULT_POINTS, leastSquares, sseOf } from './model';

describe('en küçük kareler', () => {
  it('doğru üzerindeki noktalarda tam uyum: R² = 1', () => {
    const fit = leastSquares([
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ]);
    expect(fit.m).toBeCloseTo(2, 12);
    expect(fit.b).toBeCloseTo(1, 12);
    expect(fit.r2).toBeCloseTo(1, 12);
  });

  it('en küçük kareler doğrusu, yakınındaki her doğrudan daha küçük SSE verir', () => {
    const fit = leastSquares(DEFAULT_POINTS);
    for (const [dm, db] of [[0.05, 0], [-0.05, 0], [0, 0.1], [0, -0.1], [0.02, -0.1]]) {
      expect(sseOf(DEFAULT_POINTS, fit.m + dm, fit.b + db)).toBeGreaterThan(fit.sse);
    }
  });
});
