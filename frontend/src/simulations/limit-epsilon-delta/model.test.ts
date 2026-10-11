import { describe, expect, it } from 'vitest';
import { approachTable, deltaWorks, LIMIT_FUNCTIONS } from './model';

describe('ε–δ denetimi', () => {
  it('2x + 1 için δ = ε/2 tam sınırdır', () => {
    expect(deltaWorks(LIMIT_FUNCTIONS.linear, 0.1, 0.049).works).toBe(true);
    expect(deltaWorks(LIMIT_FUNCTIONS.linear, 0.1, 0.06).works).toBe(false);
  });

  it('kaldırılabilir süreksizlikte (x²−1)/(x−1) → 2', () => {
    expect(deltaWorks(LIMIT_FUNCTIONS.removable, 0.2, 0.19).works).toBe(true);
    expect(deltaWorks(LIMIT_FUNCTIONS.removable, 0.2, 0.25).works).toBe(false);
  });

  it('sıçramada küçük ε için hiçbir δ işe yaramaz', () => {
    for (const d of [0.5, 0.1, 0.01, 0.001]) expect(deltaWorks(LIMIT_FUNCTIONS.jump, 0.25, d).works).toBe(false);
  });

  it('sin x / x tablosu 1\'e yaklaşır', () => {
    const t = approachTable(LIMIT_FUNCTIONS.sinc);
    expect(t[3].left).toBeCloseTo(1, 7);
    expect(t[3].right).toBeCloseTo(1, 7);
  });
});
