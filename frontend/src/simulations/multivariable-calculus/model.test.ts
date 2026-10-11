import { describe, expect, it } from 'vitest';
import { descend, SURFACES, type Surface } from './model';

function numericGrad(s: Surface, x: number, y: number): [number, number] {
  const h = 1e-6;
  return [(s.f(x + h, y) - s.f(x - h, y)) / (2 * h), (s.f(x, y + h) - s.f(x, y - h)) / (2 * h)];
}

describe('yüzeyler', () => {
  it('analitik gradyanlar sayısal türevle uyuşur', () => {
    for (const s of Object.values(SURFACES)) {
      for (const [x, y] of [[0.3, -1.2], [1.5, 0.7], [-2, 2]] as [number, number][]) {
        const [gx, gy] = s.grad(x, y);
        const [nx, ny] = numericGrad(s, x, y);
        expect(gx).toBeCloseTo(nx, 5);
        expect(gy).toBeCloseTo(ny, 5);
      }
    }
  });

  it('Himmelblau minimumlarında değer ~0', () => {
    for (const [x, y] of SURFACES.himmel.minima) expect(SURFACES.himmel.f(x, y)).toBeLessThan(1e-6);
  });
});

describe('gradient descent', () => {
  it('çanakta küçük öğrenme oranıyla minimuma iner', () => {
    const path = descend(SURFACES.bowl, [2.5, 2], 0.3, 20);
    const [x, y] = path[path.length - 1];
    expect(Math.hypot(x, y)).toBeLessThan(0.01);
  });

  it('Himmelblau: sol alttan başlayınca (3, 2) dışındaki bir minimuma iner', () => {
    const path = descend(SURFACES.himmel, [-3, -3], 0.2, 40);
    const [x, y] = path[path.length - 1];
    expect(SURFACES.himmel.f(x, y)).toBeLessThan(0.001);
    expect(Math.hypot(x - 3, y - 2)).toBeGreaterThan(1);
  });

  it('öğrenme oranı 2\'yi aşınca ıraksar', () => {
    const path = descend(SURFACES.bowl, [1, 1], 2.2, 10);
    const [x, y] = path[path.length - 1];
    expect(Math.hypot(x, y)).toBeGreaterThan(5);
  });
});
