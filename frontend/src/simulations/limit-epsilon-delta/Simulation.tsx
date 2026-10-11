import { Circle, Line, Plot, Point, Polygon } from 'mafs';
import { fmt } from '../../core/math/format';
import { PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { approachTable, deltaWorks, limitOf } from './model';

function Hole({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <>
      <Circle center={[x, y]} radius={r} color="var(--bg-elev)" fillOpacity={1} weight={0} />
      <Circle center={[x, y]} radius={r} color={color} fillOpacity={0} weight={2.5} />
    </>
  );
}

export function LimitSimulation({ params, animate }: SimProps) {
  const fn = limitOf(params.fn);
  const eps = num(params, 'eps');
  const delta = num(params, 'delta');
  const showBands = bool(params, 'showBands');
  const L = fn.L ?? fn.right;
  const { works } = deltaWorks(fn, eps, delta);
  const [x0, x1] = fn.view.x;
  const [y0, y1] = fn.view.y;
  const holeR = (x1 - x0) / 110;
  const table = approachTable(fn);

  return (
    <div>
      <div className="relative">
        <Plane key={String(params.fn)} x={fn.view.x} y={fn.view.y} height={380} squish>
          {showBands && (
            <>
              <Polygon points={[[x0, L - eps], [x1, L - eps], [x1, L + eps], [x0, L + eps]]} color={C.hot} fillOpacity={0.1} weight={0} />
              <Polygon points={[[fn.a - delta, y0], [fn.a + delta, y0], [fn.a + delta, y1], [fn.a - delta, y1]]} color={C.fn} fillOpacity={0.1} weight={0} />
              <Line.Segment point1={[x0, L + eps]} point2={[x1, L + eps]} color={C.hot} style="dashed" weight={1.2} />
              <Line.Segment point1={[x0, L - eps]} point2={[x1, L - eps]} color={C.hot} style="dashed" weight={1.2} />
              <Line.Segment point1={[fn.a - delta, y0]} point2={[fn.a - delta, y1]} color={C.fn} style="dashed" weight={1.2} />
              <Line.Segment point1={[fn.a + delta, y0]} point2={[fn.a + delta, y1]} color={C.fn} style="dashed" weight={1.2} />
            </>
          )}

          {fn.L === null ? (
            <>
              <Plot.OfX y={fn.f} domain={[x0, fn.a - 1e-6]} color={C.fn} weight={3} />
              <Plot.OfX y={fn.f} domain={[fn.a, x1]} color={C.fn} weight={3} />
            </>
          ) : (
            <Plot.OfX y={fn.f} color={C.fn} weight={3} />
          )}

          {showBands &&
            (fn.L === null ? (
              <>
                <Plot.OfX y={fn.f} domain={[fn.a - delta, fn.a - 1e-6]} color={C.hot} weight={5.5} />
                <Plot.OfX y={fn.f} domain={[fn.a, fn.a + delta]} color={C.tan} weight={5.5} />
              </>
            ) : (
              <Plot.OfX y={fn.f} domain={[fn.a - delta, fn.a + delta]} color={works ? C.tan : C.hot} weight={5.5} />
            ))}

          {fn.L === null ? (
            <>
              <Hole x={fn.a} y={fn.left} r={holeR} color={C.fn} />
              <Point x={fn.a} y={fn.right} color={C.fn} />
            </>
          ) : fn.valueAtA === null ? (
            <Hole x={fn.a} y={fn.L} r={holeR} color={C.fn} />
          ) : null}
        </Plane>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {showBands ? (
            <StageNote tone={works ? 'text-tan' : 'text-hot'}>
              {works ? '✓ δ yeterli: kalın parça tamamen ε bandında' : '✗ grafik ε bandından taşıyor'}
            </StageNote>
          ) : (
            <StageNote>x → {fmt(fn.a)} iken f(x) → ?</StageNote>
          )}
          <StageButton onClick={() => animate({ key: 'eps', to: 0.05, durationMs: 2200 })}>ε → 0,05 ▶</StageButton>
        </div>
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Değer tablosu · x → {fmt(fn.a)}</PanelTitle>
        <div className="overflow-x-auto px-4 pb-3">
          <table className="w-full font-mono text-[12.5px] tabular-nums">
            <thead>
              <tr className="text-left text-ink-3">
                <th className="py-1 font-normal">h</th>
                <th className="py-1 font-normal">f(a − h) · soldan</th>
                <th className="py-1 font-normal">f(a + h) · sağdan</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.h} className="border-t border-rule">
                  <td className="py-1 text-ink-2">{fmt(r.h, 4)}</td>
                  <td className="py-1 text-fn">{fmt(r.left, 6)}</td>
                  <td className="py-1 text-fn">{fmt(r.right, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
