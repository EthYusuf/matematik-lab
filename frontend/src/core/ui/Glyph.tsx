interface GlyphProps {
  fn: (x: number) => number;
  className?: string;
  color?: string;
}

const W = 120;
const H = 48;
const N = 80;

/** Bir konunun "imzası": [-1, 1] aralığında çizilmiş küçük bir eğri. */
export function Glyph({ fn, className, color = 'var(--c-fn)' }: GlyphProps) {
  let d = '';
  let pen = false;
  for (let i = 0; i <= N; i++) {
    const x = -1 + (2 * i) / N;
    const y = fn(x);
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    const px = (i / N) * W;
    const py = H / 2 - Math.max(-1.15, Math.min(1.15, y)) * (H / 2.6);
    d += `${pen ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
    pen = true;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden fill="none">
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="var(--rule-strong)" strokeWidth="1" />
      <line x1={W / 2} x2={W / 2} y1="2" y2={H - 2} stroke="var(--rule-strong)" strokeWidth="1" />
      <path d={d} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
