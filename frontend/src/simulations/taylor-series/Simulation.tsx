import { Line, MovablePoint, Plot, Point, Polygon } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageButton, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import type { SimProps } from '../../core/types';
import { taylorState } from './model';

export function TaylorSimulation({ params, setParams, animate }: SimProps) {
  const s = taylorState(params);
  const { fn, a, N, P, x0, R } = s;
  const [xMin, xMax] = fn.view.x;
  const [yMin, yMax] = fn.view.y;
  const clampY = (y: number) => Math.max(yMin - 50, Math.min(yMax + 50, y));
  const fx = fn.f(x0);
  const px = P(x0);

  return (
    <div className="relative">
      <Plane key={String(params.fn)} x={fn.view.x} y={fn.view.y} height={440} squish>
        {Number.isFinite(R) && (
          <>
            <Polygon
              points={[
                [Math.max(xMin, a - R), yMin],
                [Math.min(xMax, a + R), yMin],
                [Math.min(xMax, a + R), yMax],
                [Math.max(xMin, a - R), yMax],
              ]}
              color={C.tan}
              fillOpacity={0.08}
              weight={0}
            />
            <Line.Segment point1={[a - R, yMin]} point2={[a - R, yMax]} color={C.tan} style="dashed" weight={1.5} />
            <Line.Segment point1={[a + R, yMin]} point2={[a + R, yMax]} color={C.tan} style="dashed" weight={1.5} />
          </>
        )}
        <Plot.OfX y={fn.f} color={C.fn} weight={3.2} />
        <Plot.OfX y={(x) => clampY(P(x))} color={C.hot} weight={2.8} />
        <Line.Segment point1={[a, yMin]} point2={[a, yMax]} color={C.pt} style="dashed" weight={1.2} />
        <Point x={a} y={fn.f(a)} color={C.pt} />
        {Number.isFinite(fx) && Number.isFinite(px) && (
          <Line.Segment point1={[x0, fx]} point2={[x0, clampY(px)]} color={C.ink} style="dashed" weight={1.5} />
        )}
        {Number.isFinite(px) && Math.abs(px) < 60 && <Point x={x0} y={px} color={C.hot} />}
        <MovablePoint
          point={[x0, Number.isFinite(fx) ? fx : 0]}
          color={C.ink}
          constrain={([x]) => {
            const nx = Math.max(xMin + 0.2, Math.min(xMax - 0.2, Math.round(x * 20) / 20));
            const y = fn.f(nx);
            return [nx, Number.isFinite(y) ? y : 0];
          }}
          onMove={([x]) => setParams({ x0: x })}
        />
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          <StageNote>
            mavi: f(x) · kırmızı: P<sub>{N}</sub>(x) · a = {fmt(a)}
          </StageNote>
          {Number.isFinite(R) && <StageNote tone="text-tan">yakınsaklık yarıçapı R = {fmt(R)}</StageNote>}
        </div>
        <StageButton onClick={() => animate({ key: 'N', to: 15, durationMs: 3600 })}>terim ekle ▶</StageButton>
      </div>
    </div>
  );
}
