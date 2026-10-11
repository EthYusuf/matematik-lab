import { Line, MovablePoint, Plot, Text } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { compound, modelOf } from './model';

const T_MAX = 30;

/** Ekseni ~5 çizgiye bölen "yuvarlak" adım: 1, 2, 5 × 10ᵏ */
function niceStep(span: number): number {
  const raw = span / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
}

export function ExpSimulation({ params, setParams }: SimProps) {
  const m = modelOf(params);
  const t = num(params, 't');
  const log = bool(params, 'logScale');
  const y = (v: number) => (log ? Math.log10(Math.max(v, 1e-9)) : v);

  const curves: { f: (x: number) => number; color: string; dashed?: boolean; weight: number; label?: string }[] = [{ f: m.f, color: C.fn, weight: 3.2 }];
  if (m.kind === 'interest') {
    if (Number.isFinite(m.n)) curves.push({ f: (x) => compound(m.P, m.r, Infinity, x), color: C.hot, dashed: true, weight: 1.8, label: 'sürekli' });
    if (m.n !== 1) curves.push({ f: (x) => compound(m.P, m.r, 1, x), color: C.ink3, dashed: true, weight: 1.5, label: 'yıllık' });
  }

  const samples = curves.flatMap((c) => Array.from({ length: 61 }, (_, i) => c.f((T_MAX * i) / 60)));
  let lo = 0;
  let hi = Math.min(Math.max(...samples), m.P * 40) * 1.08;
  if (log) {
    lo = Math.floor(Math.log10(Math.max(Math.min(...samples), 1e-3)));
    hi = Math.ceil(Math.log10(Math.max(...samples))) + 0.1;
  }
  const yStep = log ? 1 : niceStep(hi);
  const yLabel = (v: number) => (log ? fmt(10 ** v, 0) : fmt(v, 0));
  const value = m.f(t);

  return (
    <div className="relative">
      <Plane key={`${m.kind}-${log}`} x={[-1, T_MAX + 0.5]} y={[log ? lo - 0.2 : -hi * 0.06, hi]} height={420} squish xStep={5} yStep={yStep} yLabels={yLabel}>
        {m.kind === 'decay' &&
          [1, 2, 3, 4].map((k) =>
            k * m.T <= T_MAX ? (
              <g key={k}>
                <Line.Segment point1={[k * m.T, y(m.P / 2 ** k)]} point2={[0, y(m.P / 2 ** k)]} color={C.pt} style="dashed" weight={1.2} />
                <Line.Segment point1={[k * m.T, log ? lo - 0.2 : 0]} point2={[k * m.T, y(m.P / 2 ** k)]} color={C.pt} style="dashed" weight={1.2} />
                <Text x={k * m.T} y={y(m.P / 2 ** k)} attach="ne" size={12} color={C.pt}>
                  {`1/${2 ** k}`}
                </Text>
              </g>
            ) : null,
          )}
        {curves.map((c, i) => (
          <Plot.OfX key={i} y={(x) => y(c.f(x))} domain={[0, T_MAX]} color={c.color} weight={c.weight} style={c.dashed ? 'dashed' : 'solid'} />
        ))}
        <Line.Segment point1={[t, log ? lo - 0.2 : 0]} point2={[t, y(value)]} color={C.pt} style="dashed" weight={1.5} />
        <MovablePoint point={[t, y(value)]} color={C.pt} constrain={([x]) => [Math.max(0, Math.min(T_MAX, Math.round(x * 2) / 2)), y(m.f(Math.max(0, Math.min(T_MAX, Math.round(x * 2) / 2))))]} onMove={([x]) => setParams({ t: x })} />
        <Text x={t} y={y(value)} attach="nw" attachDistance={16} size={13} color={C.ink}>
          {fmt(value, 1)}
        </Text>
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        <StageNote>
          t = {fmt(t, 1)} yıl · {m.kind === 'decay' ? `yarı ömür ${fmt(m.T, 1)} yıl` : `ikiye katlanma ${Number.isFinite(m.characteristic) ? fmt(m.characteristic, 2) : '∞'} yıl`}
        </StageNote>
        {log && <StageNote tone="text-hot">logaritmik ölçek: üstel eğri doğruya dönüşür</StageNote>}
        {m.kind === 'interest' && Number.isFinite(m.n) && <StageNote tone="text-hot">kesikli kırmızı: sürekli bileşik</StageNote>}
      </div>
    </div>
  );
}
