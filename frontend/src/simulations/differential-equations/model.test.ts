import { describe, expect, it } from 'vitest';
import { EQUATIONS, euler, lotka, rk4, sir } from './model';

const last = <T,>(a: T[]) => a[a.length - 1];

describe('sayısal çözücüler', () => {
  it('Euler y′ = y için (1 + h)^(x/h) verir ve gerçek değerin altında kalır', () => {
    const y2 = last(euler(EQUATIONS.exp.f, 0, 1, 0.5, 2))[1];
    expect(y2).toBeCloseTo(1.5 ** 4, 12);
    expect(y2).toBeLessThan(Math.E ** 2);
  });

  it('h = 0,01 ile hata 0,1 altına iner', () => {
    expect(Math.abs(last(euler(EQUATIONS.exp.f, 0, 1, 0.01, 2))[1] - Math.E ** 2)).toBeLessThan(0.1);
    expect(Math.abs(last(euler(EQUATIONS.exp.f, 0, 1, 0.05, 2))[1] - Math.E ** 2)).toBeGreaterThan(0.1);
  });

  it('RK4 çok daha doğrudur', () => {
    expect(last(rk4(EQUATIONS.exp.f, 0, 1, 0.1, 2))[1]).toBeCloseTo(Math.E ** 2, 4);
  });
});

describe('modeller', () => {
  it('SIR: R₀ < 1 iken salgın büyümez', () => {
    expect(sir(0.15, 0.2).peak).toBeLessThanOrEqual(0.0101);
    expect(sir(0.5, 0.1).peak).toBeGreaterThan(0.4);
  });

  it('SIR: toplam nüfus korunur', () => {
    const { traj } = sir(0.4, 0.1);
    for (const [S, I, R] of traj) expect(S + I + R).toBeCloseTo(1, 9);
  });

  it('Lotka–Volterra: denge noktasında sabit kalır', () => {
    const { traj } = lotka(1, 0.5, 0.2, 0.6, 3, 2);
    const [x, y] = last(traj);
    expect(x).toBeCloseTo(3, 6);
    expect(y).toBeCloseTo(2, 6);
  });
});
