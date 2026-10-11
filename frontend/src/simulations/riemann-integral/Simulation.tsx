import { Line, Plot, Polygon } from 'mafs';
import { useMemo } from 'react';
import type { RiemannRule } from '../../core/math/calculus';
import { fmt, pow10 } from '../../core/math/format';
import { LineChart, PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, type SimProps } from '../../core/types';
import { errorCurve, integralState, RULE_LABELS } from './model';

const X_VIEW: [number, number] = [-0.4, 4.3];
const RULES: RiemannRule[] = ['left', 'right', 'mid', 'trapezoid'];

export function IntegralSimulation({ params, animate }: SimProps) {
  const s = integralState(params);
  const { fn, a, b, n, rule, dx } = s;
  const showExact = bool(params, 'showExact');

  // Dikdörtgenler (ya da yamuklar): pozitif kısım mavi, negatif kısım kırmızı.
  const shapes = useMemo(() => {
    const out: { pts: [number, number][]; negative: boolean }[] = [];
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx;
      const x1 = x0 + dx;
      if (rule === 'trapezoid') {
        const y0 = fn.f(x0);
        const y1 = fn.f(x1);
        out.push({ pts: [[x0, 0], [x0, y0], [x1, y1], [x1, 0]], negative: y0 + y1 < 0 });
      } else {
        const xs = rule === 'left' ? x0 : rule === 'right' ? x1 : (x0 + x1) / 2;
        const h = fn.f(xs);
        out.push({ pts: [[x0, 0], [x0, h], [x1, h], [x1, 0]], negative: h < 0 });
      }
    }
    return out;
  }, [fn, a, dx, n, rule]);

  const exactArea = useMemo(() => {
    const pts: [number, number][] = [[a, 0]];
    for (let i = 0; i <= 120; i++) {
      const x = a + ((b - a) * i) / 120;
      pts.push([x, fn.f(x)]);
    }
    pts.push([b, 0]);
    return pts;
  }, [fn, a, b]);

  // Görünüm, seçili aralıktaki fonksiyon değerlerine uyarlanır.
  const yView = useMemo<[number, number]>(() => {
    let lo = 0;
    let hi = 0;
    for (let i = 0; i <= 80; i++) {
      const y = fn.f(X_VIEW[0] + ((Math.min(X_VIEW[1], b + 0.3) - X_VIEW[0]) * i) / 80);
      if (Number.isFinite(y)) {
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    }
    const pad = (hi - lo) * 0.12 || 1;
    return [lo - pad * (lo < 0 ? 1 : 0.4), hi + pad];
  }, [fn, b]);
  const yStep = (yView[1] - yView[0]) / 7 > 1.5 ? 2 : (yView[1] - yView[0]) / 7 > 0.6 ? 1 : 0.5;

  const curves = useMemo(() => RULES.map((r) => ({ rule: r, points: errorCurve(fn, a, b, r) })), [fn, a, b]);
  const yLo = Math.max(-6, Math.floor(Math.min(...curves.flatMap((c) => c.points.map((p) => p[1]))))) ;
  const yHi = Math.ceil(Math.max(...curves.flatMap((c) => c.points.map((p) => p[1]))));
  const current = curves.find((c) => c.rule === rule)!;

  return (
    <div>
      <div className="relative">
        <Plane key={String(params.fn)} x={X_VIEW} y={yView} height={360} yStep={yStep} squish>
          {showExact && <Polygon points={exactArea} color={C.tan} fillOpacity={0.22} weight={0} />}
          {shapes.map((r, i) => (
            <Polygon
              key={i}
              points={r.pts}
              color={r.negative ? C.hot : C.fn}
              fillOpacity={0.16}
              weight={n > 60 ? 0.5 : 1.2}
            />
          ))}
          <Plot.OfX y={fn.f} color={C.fn} weight={3} />
          <Line.Segment point1={[a, yView[0]]} point2={[a, yView[1]]} color={C.ink3} style="dashed" weight={1} />
          <Line.Segment point1={[b, yView[0]]} point2={[b, yView[1]]} color={C.ink3} style="dashed" weight={1} />
        </Plane>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <StageNote>
            n = {n} · Δx = {fmt(dx, 3)} · {RULE_LABELS[rule]} kuralı
          </StageNote>
          <StageButton onClick={() => animate({ key: 'n', to: 100, durationMs: 3000 })}>n → 100 ▶</StageButton>
        </div>
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Hata grafiği · log₁₀ |hata| — n arttıkça</PanelTitle>
        <div className="px-2 pb-2">
          <LineChart
            ariaLabel="Parça sayısına göre hata"
            height={170}
            x={[1, 100]}
            y={[yLo, yHi + 0.2]}
            xTicks={[1, 20, 40, 60, 80, 100]}
            xFormat={(v) => String(v)}
            yFormat={pow10}
            xLabel="n"
            series={curves.map((c) => ({
              points: c.points,
              color: c.rule === rule ? 'var(--c-hot)' : 'var(--ink-3)',
              width: c.rule === rule ? 2.5 : 1.2,
              opacity: c.rule === rule ? 1 : 0.45,
              dashed: c.rule !== rule && (c.rule === 'mid' || c.rule === 'trapezoid'),
            }))}
            markers={[{ x: n, y: current.points[n - 1][1], color: 'var(--c-hot)' }]}
          />
        </div>
      </div>
    </div>
  );
}
