import { num, type ParamState } from '../../core/types';

export const TAU = 2 * Math.PI;

export interface Wave {
  A: number;
  B: number;
  C: number;
  D: number;
}

export const waveOf = (p: ParamState): Wave => ({ A: num(p, 'A'), B: num(p, 'B'), C: num(p, 'C'), D: num(p, 'D') });

/** y = A·sin(Bx + C) + D */
export const waveY = ({ A, B, C, D }: Wave, x: number) => A * Math.sin(B * x + C) + D;

/** Çember üzerindeki P noktası: dalganın yüksekliği her an P'nin yüksekliğine eşittir. */
export function circlePoint({ A, B, C, D }: Wave, theta: number, cx: number): [number, number] {
  const phi = B * theta + C;
  return [cx + A * Math.cos(phi), D + A * Math.sin(phi)];
}

/**
 * Çember üzerinde sürüklenen noktanın açısından θ'yı geri bulur.
 * B > 1 iken birden çok θ aynı noktaya gider; mevcut θ'ya en yakını seçilir.
 */
export function thetaFromCircleAngle(alpha: number, { A, B, C }: Wave, current: number): number {
  const phi = A >= 0 ? alpha : alpha + Math.PI;
  const period = TAU / B;
  const base = (phi - C) / B;
  let best = current;
  let bestDist = Infinity;
  const kMin = Math.floor((0 - base) / period) - 1;
  const kMax = Math.ceil((TAU - base) / period) + 1;
  for (let k = kMin; k <= kMax; k++) {
    const t = base + k * period;
    if (t < 0 || t > TAU) continue;
    const d = Math.abs(t - current);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  if (bestDist === Infinity) {
    // B küçükken [0, 2π] içinde aday olmayabilir: en yakın sınıra yapıştır.
    const t = base - Math.floor(base / period) * period;
    return Math.min(TAU, Math.max(0, t));
  }
  return best;
}
