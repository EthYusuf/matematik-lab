import { Line, MovablePoint, Plot, Polygon } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, type SimProps } from '../../core/types';
import { regState } from './model';

const snap = (v: number) => Math.round(v * 4) / 4;

export function RegressionSimulation({ params, setParams }: SimProps) {
  const st = regState(params);
  const { pts, fit, user, um, ub } = st;
  const showRes = bool(params, 'showResiduals');
  const showSq = bool(params, 'showSquares');
  const m = user ? um : fit.m;
  const b = user ? ub : fit.b;
  const line = (x: number) => m * x + b;

  return (
    <div className="relative">
      <Plane x={[-0.5, 8.5]} y={[-0.5, 8]} height={440}>
        {showSq &&
          pts.map(([x, y], i) => {
            const r = y - line(x);
            const s = Math.abs(r);
            // Artığın karesi: kenarı |artık| olan gerçek bir kare.
            return (
              <Polygon
                key={`sq${i}`}
                points={[
                  [x, line(x)],
                  [x, y],
                  [x + s, y],
                  [x + s, line(x)],
                ]}
                color={C.hot}
                fillOpacity={0.18}
                weight={1}
              />
            );
          })}
        {user && <Plot.OfX y={(x) => fit.m * x + fit.b} color={C.tan} style="dashed" weight={1.6} opacity={0.6} />}
        <Plot.OfX y={line} color={user ? C.hot : C.tan} weight={3} />
        {showRes && pts.map(([x, y], i) => <Line.Segment key={`r${i}`} point1={[x, y]} point2={[x, line(x)]} color={C.hot} style="dashed" weight={1.8} />)}
        {pts.map(([x, y], i) => (
          <MovablePoint key={i} point={[x, y]} color={C.fn} onMove={([nx, ny]) => setParams({ [`p${i}x`]: Math.max(0, Math.min(8, snap(nx))), [`p${i}y`]: Math.max(-0.25, Math.min(7.75, snap(ny))) })} />
        ))}
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        <StageNote>noktaları sürükle</StageNote>
        {user ? (
          <StageNote tone="text-hot">
            senin SSE: {fmt(st.userSse, 3)} · en iyi: {fmt(fit.sse, 3)}
          </StageNote>
        ) : (
          <StageNote tone="text-tan">
            ŷ = {fmt(fit.m, 3)}x {fit.b < 0 ? '−' : '+'} {fmt(Math.abs(fit.b), 3)} · R² = {fmt(fit.r2, 3)}
          </StageNote>
        )}
      </div>
    </div>
  );
}
