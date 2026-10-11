import { describe, expect, it } from 'vitest';
import { circlePoint, TAU, thetaFromCircleAngle, waveY, type Wave } from './wave';

const unit: Wave = { A: 1, B: 1, C: 0, D: 0 };

describe('dalga ve çember senkronu', () => {
  it('P noktasının yüksekliği dalganın değerine eşittir', () => {
    const waves: Wave[] = [unit, { A: 2, B: 3, C: 0.5, D: -1 }, { A: -1.5, B: 0.5, C: -Math.PI / 3, D: 1 }];
    for (const w of waves) {
      for (const t of [0, 0.7, 2, 5.5]) {
        expect(circlePoint(w, t, -3)[1]).toBeCloseTo(waveY(w, t), 12);
      }
    }
  });

  it('birim çemberde temel değerler', () => {
    expect(waveY(unit, Math.PI / 2)).toBeCloseTo(1, 12);
    expect(circlePoint(unit, 0, 0)).toEqual([1, 0]);
  });
});

describe('thetaFromCircleAngle', () => {
  it('birim çemberde açıyı doğrudan θ olarak verir', () => {
    expect(thetaFromCircleAngle(1.2, unit, 0)).toBeCloseTo(1.2, 12);
  });

  it('B = 2 iken mevcut θ değerine en yakın çözümü seçer', () => {
    const w: Wave = { A: 1, B: 2, C: 0, D: 0 };
    // α = π/2 → θ = π/4 veya 5π/4
    expect(thetaFromCircleAngle(Math.PI / 2, w, 0.5)).toBeCloseTo(Math.PI / 4, 12);
    expect(thetaFromCircleAngle(Math.PI / 2, w, 4)).toBeCloseTo((5 * Math.PI) / 4, 12);
  });

  it('negatif genlikte açıyı π kadar çevirir', () => {
    const w: Wave = { A: -1, B: 1, C: 0, D: 0 };
    const theta = thetaFromCircleAngle(0, w, 3);
    expect(theta).toBeCloseTo(Math.PI, 12);
  });

  it('her zaman [0, 2π] aralığında kalır', () => {
    const w: Wave = { A: 1, B: 0.5, C: 3, D: 0 };
    for (const a of [-3, -1, 0, 1, 3]) {
      const t = thetaFromCircleAngle(a, w, 1);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(TAU);
    }
  });
});
