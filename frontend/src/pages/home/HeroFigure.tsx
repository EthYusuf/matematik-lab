import { useEffect, useState } from 'react';

const CX = 92;
const CY = 150;
const R = 64;
const WAVE_X0 = 196;
const WAVE_W = 330;
const TAU = Math.PI * 2;

/**
 * Ana sayfadaki canlı çizim: çember döner, P noktasının yüksekliği sağda
 * sinüs dalgasını çizer. Hareket azaltma tercihinde sabit durur.
 */
export function HeroFigure() {
  const [t, setT] = useState(0.9);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setT((v) => (v + ((now - last) / 1000) * 0.85) % TAU);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const px = CX + R * Math.cos(t);
  const py = CY - R * Math.sin(t);
  const waveX = (a: number) => WAVE_X0 + (a / TAU) * WAVE_W;
  const waveY = (a: number) => CY - R * Math.sin(a);

  let traced = '';
  for (let a = 0; a <= t; a += 0.04) traced += `${traced ? 'L' : 'M'}${waveX(a).toFixed(1)} ${waveY(a).toFixed(1)}`;
  traced += `${traced ? 'L' : 'M'}${waveX(t).toFixed(1)} ${waveY(t).toFixed(1)}`;
  let ghost = '';
  for (let a = 0; a <= TAU + 0.001; a += 0.05) ghost += `${ghost ? 'L' : 'M'}${waveX(a).toFixed(1)} ${waveY(a).toFixed(1)}`;

  const arcEnd = { x: CX + 22 * Math.cos(t), y: CY - 22 * Math.sin(t) };
  const largeArc = t > Math.PI ? 1 : 0;

  return (
    <svg viewBox="0 0 560 300" className="h-auto w-full" role="img" aria-label="Dönen birim çember ve çizdiği sinüs dalgası">
      {/* eksenler */}
      <line x1={CX - R - 18} x2={WAVE_X0 + WAVE_W + 12} y1={CY} y2={CY} stroke="var(--rule-strong)" />
      <line x1={CX} x2={CX} y1={CY - R - 18} y2={CY + R + 18} stroke="var(--rule-strong)" />
      <line x1={WAVE_X0} x2={WAVE_X0} y1={CY - R - 18} y2={CY + R + 18} stroke="var(--rule-strong)" />

      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--ink)" strokeWidth="2" />
      <path d={ghost} fill="none" stroke="var(--c-hot)" strokeOpacity="0.22" strokeWidth="2" />
      <path d={traced} fill="none" stroke="var(--c-hot)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* açı yayı */}
      <path d={`M${CX + 22} ${CY} A22 22 0 ${largeArc} 0 ${arcEnd.x} ${arcEnd.y}`} fill="none" stroke="var(--c-pt)" strokeWidth="2.5" />

      <line x1={CX} y1={CY} x2={px} y2={py} stroke="var(--ink)" strokeWidth="1.5" />
      <line x1={CX} y1={CY} x2={px} y2={CY} stroke="var(--c-fn)" strokeWidth="4" strokeLinecap="round" />
      <line x1={px} y1={CY} x2={px} y2={py} stroke="var(--c-hot)" strokeWidth="4" strokeLinecap="round" />
      <line x1={px} y1={py} x2={waveX(t)} y2={py} stroke="var(--ink-3)" strokeWidth="1.5" strokeDasharray="4 4" />

      <circle cx={px} cy={py} r="6.5" fill="var(--bg-elev)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx={waveX(t)} cy={py} r="5" fill="var(--c-hot)" />

      {/* defter kenarı notları */}
      <g fontFamily="var(--font-display)" fontStyle="italic" fill="var(--ink-2)">
        <text x={CX - 40} y={CY + R + 48} fontSize="21">
          θ döndükçe…
        </text>
        <text x={WAVE_X0 + 150} y={CY + R + 48} fontSize="21">
          …dalga kendini çizer
        </text>
        <text x={WAVE_X0 + WAVE_W - 30} y={CY - R - 20} fontSize="20" fill="var(--c-hot)">
          sin θ
        </text>
      </g>
      <path
        d={`M${WAVE_X0 + 140} ${CY + R + 42} q-30 -4 -46 -2`}
        fill="none"
        stroke="var(--ink-3)"
        strokeWidth="1.4"
        markerEnd="url(#ok)"
      />
      <defs>
        <marker id="ok" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" fill="none" stroke="var(--ink-3)" strokeWidth="1.6" />
        </marker>
      </defs>
    </svg>
  );
}
