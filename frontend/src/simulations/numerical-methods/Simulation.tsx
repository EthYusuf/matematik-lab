import { Line, MovablePoint, Plot, Point, Polygon } from 'mafs';
import { pow10 } from '../../core/math/format';
import { LineChart, PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import type { SimProps } from '../../core/types';
import { bisection, newton, numState } from './model';

const MAX_K = 12;

export function NumericalSimulation({ params, setParams, animate }: SimProps) {
  const st = numState(params);
  const { prob, root, method } = st;
  const [xMin, xMax] = prob.view.x;
  const [yMin, yMax] = prob.view.y;
  const showNewton = method !== 'bisection';
  const showBis = method !== 'newton';

  const nx = st.newton.filter((x) => x > xMin - 50 && x < xMax + 50);
  const bands = st.bisection;
  const current = bands[bands.length - 1];

  // Yakınsama grafiği (tüm adımlar, log ölçek)
  const nAll = newton(prob, st.x0, MAX_K);
  const bAll = bisection(prob, MAX_K);
  const err = (v: number) => Math.log10(Math.max(Math.abs(v - root), 1e-16));
  const nErr = nAll.map((x, i): [number, number] => [i, err(x)]);
  const bErr = bAll.map(([a, b], i): [number, number] => [i, err((a + b) / 2)]);

  return (
    <div>
      <div className="relative">
        <Plane key={String(params.fn)} x={prob.view.x} y={prob.view.y} height={380} squish yStep={(yMax - yMin) / 8 > 1.5 ? 2 : 1}>
          {showBis && (
            <>
              <Polygon
                points={[
                  [current[0], yMin],
                  [current[1], yMin],
                  [current[1], yMax],
                  [current[0], yMax],
                ]}
                color={C.fn}
                fillOpacity={0.12}
                weight={0}
              />
              {bands.map(([a, b], i) => (
                <Line.Segment key={i} point1={[a, yMin + (i + 1) * 0.045 * (yMax - yMin)]} point2={[b, yMin + (i + 1) * 0.045 * (yMax - yMin)]} color={C.fn} weight={3} opacity={0.35 + (0.65 * (i + 1)) / bands.length} />
              ))}
            </>
          )}
          <Plot.OfX y={prob.f} color={C.ink} weight={2.8} />
          {showNewton &&
            nx.slice(0, -1).map((x, i) => {
              const next = nx[i + 1];
              return (
                <g key={i}>
                  <Line.Segment point1={[x, 0]} point2={[x, prob.f(x)]} color={C.hot} style="dashed" weight={1.2} />
                  <Line.Segment point1={[x, prob.f(x)]} point2={[next, 0]} color={C.hot} weight={2} />
                  <Point x={next} y={0} color={C.hot} />
                </g>
              );
            })}
          <Point x={root} y={0} color={C.tan} />
          {showNewton && (
            <MovablePoint
              point={[st.x0, prob.f(st.x0)]}
              color={C.pt}
              constrain={([x]) => {
                const c = Math.max(xMin, Math.min(xMax, Math.round(x * 20) / 20));
                return [c, prob.f(c)];
              }}
              onMove={([x]) => setParams({ x0: Math.max(xMin, Math.min(xMax, Math.round(x * 20) / 20)) })}
            />
          )}
        </Plane>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-2">
            {showNewton && <StageNote tone="text-hot">Newton: teğet → x eksenini kestiği yer</StageNote>}
            {showBis && <StageNote tone="text-fn">İkiye bölme: işaret değişen yarıyı seç</StageNote>}
          </div>
          <StageButton onClick={() => animate({ key: 'k', to: 8, durationMs: 3200 })}>adım at ▶</StageButton>
        </div>
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Yakınsama yarışı · log₁₀ |hata| (her adım)</PanelTitle>
        <div className="px-2 pb-2">
          <LineChart
            ariaLabel="Newton ve ikiye bölme yöntemlerinin hata karşılaştırması"
            height={180}
            x={[0, MAX_K]}
            y={[-16, 1]}
            yTicks={[-15, -10, -5, 0]}
            yFormat={pow10}
            xFormat={(v) => String(v)}
            xLabel="adım"
            series={[
              { points: nErr, color: 'var(--c-hot)', width: 2.4 },
              { points: bErr, color: 'var(--c-fn)', width: 2.4 },
            ]}
            refLines={[{ x: st.k, color: 'var(--c-pt)' }]}
          />
        </div>
      </div>
    </div>
  );
}
