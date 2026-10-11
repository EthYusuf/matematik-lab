import { num, str, type ParamState } from '../../core/types';

export type Pt = [number, number];
type Field = (x: number, y: number) => number;

export const EQUATIONS = {
  exp: { label: "y′ = y", tex: "y' = y", f: ((_x, y) => y) as Field },
  linear: { label: "y′ = x − y", tex: "y' = x - y", f: ((x, y) => x - y) as Field },
  logistic: { label: "y′ = 0,8y(1 − y/4)", tex: "y' = 0{,}8\\,y\\left(1 - \\frac{y}{4}\\right)", f: ((_x, y) => 0.8 * y * (1 - y / 4)) as Field },
};

export type EqKey = keyof typeof EQUATIONS;
export const eqOf = (k: unknown) => EQUATIONS[(k as EqKey) in EQUATIONS ? (k as EqKey) : 'exp'];

/** Euler yöntemi: x0'dan x1'e h adımlarla. */
export function euler(f: Field, x0: number, y0: number, h: number, x1: number): Pt[] {
  const pts: Pt[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  const steps = Math.min(4000, Math.ceil((x1 - x0) / h - 1e-9));
  for (let i = 0; i < steps; i++) {
    const step = Math.min(h, x1 - x);
    y += step * f(x, y);
    x += step;
    pts.push([x, y]);
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) break;
  }
  return pts;
}

/** Klasik 4. dereceden Runge–Kutta (tek değişken). */
export function rk4(f: Field, x0: number, y0: number, h: number, x1: number): Pt[] {
  const pts: Pt[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  const n = Math.ceil(Math.abs(x1 - x0) / h);
  const s = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const k1 = f(x, y);
    const k2 = f(x + s / 2, y + (s / 2) * k1);
    const k3 = f(x + s / 2, y + (s / 2) * k2);
    const k4 = f(x + s, y + s * k3);
    y += (s / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    x += s;
    pts.push([x, y]);
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) break;
  }
  return pts;
}

/** Sistemler için RK4: durum vektörü ve türev fonksiyonu. */
export function rk4System(deriv: (s: number[]) => number[], s0: number[], dt: number, steps: number): number[][] {
  const out = [s0];
  let s = s0;
  for (let i = 0; i < steps; i++) {
    const k1 = deriv(s);
    const k2 = deriv(s.map((v, j) => v + (dt / 2) * k1[j]));
    const k3 = deriv(s.map((v, j) => v + (dt / 2) * k2[j]));
    const k4 = deriv(s.map((v, j) => v + dt * k3[j]));
    s = s.map((v, j) => v + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    out.push(s);
  }
  return out;
}

export const SIR_DAYS = 160;

export function sir(beta: number, gamma: number, i0 = 0.01) {
  const dt = 0.25;
  const traj = rk4System(([S, I]) => [-beta * S * I, beta * S * I - gamma * I, gamma * I], [1 - i0, i0, 0], dt, SIR_DAYS / dt);
  let peak = 0;
  let peakDay = 0;
  traj.forEach(([, I], k) => {
    if (I > peak) {
      peak = I;
      peakDay = k * dt;
    }
  });
  return { traj, dt, peak, peakDay, finalR: traj[traj.length - 1][2] };
}

export const LV_TIME = 40;

export function lotka(alpha: number, beta: number, delta: number, gamma: number, x0: number, y0: number) {
  const dt = 0.02;
  return { dt, traj: rk4System(([x, y]) => [alpha * x - beta * x * y, delta * x * y - gamma * y], [x0, y0], dt, LV_TIME / dt) };
}

export function deState(p: ParamState) {
  return {
    mode: str(p, 'mode'),
    eq: eqOf(str(p, 'eq')),
    x0: num(p, 'x0'),
    y0: num(p, 'y0'),
    h: num(p, 'h'),
  };
}
