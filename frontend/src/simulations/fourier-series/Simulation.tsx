import { Circle, Line, Plot, Point } from 'mafs';
import { useEffect } from 'react';
import { fmtPi } from '../../core/math/format';
import { StageButton, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { fourierState } from './model';

const TAU = 2 * Math.PI;
const CX = -2.6;

export function FourierSimulation({ params, setParams, animate }: SimProps) {
  const { w, N, f } = fourierState(params);
  const t = num(params, 't');
  const playing = bool(params, 'playing');
  const showTarget = bool(params, 'showTarget');

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setParams((p) => ({ t: (Number(p.t) + dt * 0.8) % TAU }));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, setParams]);

  // Dönen çember zinciri: her harmonik bir çember; uç noktanın yüksekliği = kısmi toplam.
  const chain: { c: [number, number]; r: number; tip: [number, number] }[] = [];
  let cur: [number, number] = [CX, 0];
  for (let k = 1; k <= N; k++) {
    const b = w.b(k);
    if (Math.abs(b) < 1e-12) continue;
    const tip: [number, number] = [cur[0] + b * Math.cos(k * t), cur[1] + b * Math.sin(k * t)];
    chain.push({ c: cur, r: Math.abs(b), tip });
    cur = tip;
  }
  const y = f(t);

  return (
    <div className="relative">
      <Plane x={[-4.6, TAU + 0.3]} y={[-1.9, 1.9]} height={400} xStep={Math.PI / 2} xLabels={(x) => (x > 0.01 ? fmtPi(x) : '')}>
        {chain.map((e, i) => (
          <g key={i}>
            <Circle center={e.c} radius={e.r} color={C.ink3} fillOpacity={0} weight={i === 0 ? 1.4 : 1} />
            <Line.Segment point1={e.c} point2={e.tip} color={C.ink} weight={1.4} />
          </g>
        ))}
        {showTarget && <Plot.OfX y={w.target} domain={[0, TAU]} color={C.ink3} style="dashed" weight={1.5} />}
        <Plot.OfX y={f} domain={[0, TAU]} color={C.hot} weight={1.8} opacity={0.3} />
        {t > 0.01 && <Plot.OfX y={f} domain={[0, t]} color={C.hot} weight={3} />}
        <Line.Segment point1={cur} point2={[t, y]} color={C.ink3} style="dashed" weight={1.2} />
        <Point x={cur[0]} y={cur[1]} color={C.pt} />
        <Point x={t} y={y} color={C.hot} />
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <StageNote>
          {w.label} dalga · {chain.length} dönen çember (harmonik)
        </StageNote>
        <div className="flex gap-2">
          <StageButton onClick={() => setParams({ playing: !playing })} pressed={playing}>
            {playing ? '❚❚ Durdur' : '▶ Döndür'}
          </StageButton>
          <StageButton onClick={() => animate({ key: 'N', to: 49, durationMs: 4000 })}>harmonik ekle ▶</StageButton>
        </div>
      </div>
    </div>
  );
}
