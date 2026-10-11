export type RealFn = (x: number) => number;

/** Kesen eğimi: (f(x+h) − f(x)) / h */
export function secantSlope(f: RealFn, x: number, h: number): number {
  return (f(x + h) - f(x)) / h;
}

/** Merkezi fark ile sayısal türev (analitik türevi olmayan fonksiyonlar için). */
export function numericDerivative(f: RealFn, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

export type RiemannRule = 'left' | 'right' | 'mid' | 'trapezoid';

/** [a, b] aralığında n parçalı Riemann toplamı. */
export function riemannSum(f: RealFn, a: number, b: number, n: number, rule: RiemannRule): number {
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    switch (rule) {
      case 'left':
        sum += f(x0);
        break;
      case 'right':
        sum += f(x1);
        break;
      case 'mid':
        sum += f((x0 + x1) / 2);
        break;
      case 'trapezoid':
        sum += (f(x0) + f(x1)) / 2;
        break;
    }
  }
  return sum * dx;
}

/** Yaklaşık eşitlik (görev doğrulamalarında kullanılır). */
export const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
