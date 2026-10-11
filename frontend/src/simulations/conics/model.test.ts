import { describe, expect, it } from 'vitest';
import { conicOf, dist } from './model';

describe('konikler', () => {
  it('elips: PF₁ + PF₂ = 2a her noktada', () => {
    for (const t of [0, 0.7, 2, 4.4]) {
      const c = conicOf({ type: 'ellipse', a: 5, b: 3, p: 1, t });
      expect(c.c).toBeCloseTo(4, 12);
      expect(dist(c.point, c.foci[0]) + dist(c.point, c.foci[1])).toBeCloseTo(10, 10);
    }
  });

  it('hiperbol: |PF₁ − PF₂| = 2a', () => {
    for (const t of [-1.5, 0, 0.9]) {
      const c = conicOf({ type: 'hyperbola', a: 2, b: 1.5, p: 1, t });
      expect(Math.abs(dist(c.point, c.foci[0]) - dist(c.point, c.foci[1]))).toBeCloseTo(4, 10);
    }
  });

  it('parabol: odak uzaklığı = doğrultman uzaklığı', () => {
    for (const t of [-3, 0.5, 2]) {
      const c = conicOf({ type: 'parabola', a: 1, b: 1, p: 1.5, t });
      expect(dist(c.point, c.foci[0])).toBeCloseTo(c.point[1] - c.directrix, 10);
    }
  });

  it('elips doğrultmanı: PF / Pd = e', () => {
    const c = conicOf({ type: 'ellipse', a: 5, b: 3, p: 1, t: 1 });
    expect(dist(c.point, c.foci[1]) / (c.directrix - c.point[0])).toBeCloseTo(c.e, 10);
  });
});
