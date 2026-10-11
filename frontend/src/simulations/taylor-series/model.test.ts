import { describe, expect, it } from 'vitest';
import { coefficients, taylor, TAYLOR_FUNCS, taylorState } from './model';

describe('Taylor polinomları', () => {
  it('sin x katsayıları: 0, 1, 0, −1/6, 0, 1/120', () => {
    const c = coefficients(TAYLOR_FUNCS.sin, 0, 5);
    [0, 1, 0, -1 / 6, 0, 1 / 120].forEach((v, i) => expect(c[i]).toBeCloseTo(v, 12));
  });

  it('eˣ için P₃(1) = 1 + 1 + 1/2 + 1/6', () => {
    const P = taylor(coefficients(TAYLOR_FUNCS.exp, 0, 3), 0);
    expect(P(1)).toBeCloseTo(8 / 3, 12);
  });

  it('görevler çözülebilir: sin(π) hatası N = 9\'da 0,01 altında, N = 7\'de değil', () => {
    const at = (N: number) => taylorState({ fn: 'sin', a: 0, N, x0: Math.PI }).error;
    expect(at(7)).toBeGreaterThan(0.01);
    expect(at(9)).toBeLessThan(0.01);
  });

  it('e² için N = 7 yeterli, N = 6 değil', () => {
    const at = (N: number) => taylorState({ fn: 'exp', a: 0, N, x0: 2 }).error;
    expect(at(6)).toBeGreaterThan(0.01);
    expect(at(7)).toBeLessThan(0.01);
  });

  it('1/(1−x): a = 0 merkezinde x = 1,5 ıraksar, a = 2 merkezinde yakınsar', () => {
    expect(taylorState({ fn: 'geom', a: 0, N: 15, x0: 1.5 }).error).toBeGreaterThan(1);
    expect(taylorState({ fn: 'geom', a: 2, N: 10, x0: 1.5 }).error).toBeLessThan(0.01);
  });
});
