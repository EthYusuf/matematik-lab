import { Line, MovablePoint, Plot, Point, Polygon, Text } from 'mafs';
import { secantSlope } from '../../core/math/calculus';
import { fmt } from '../../core/math/format';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { fnOf } from './functions';

export const H_MIN = 0.001;
export const H_MAX = 2;
const X_LIMIT = 2.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const snap = (v: number) => Math.round(v * 100) / 100;

export function DerivativeSimulation({ params, setParams, animate }: SimProps) {
  const fn = fnOf(params.fn);
  const x0 = num(params, 'x0');
  const h = num(params, 'h');
  const showSecant = bool(params, 'showSecant');
  const showTangent = bool(params, 'showTangent');
  const showDerivative = bool(params, 'showDerivative');

  const y0 = fn.f(x0);
  const x1 = x0 + h;
  const y1 = fn.f(x1);
  const slope = fn.df(x0);
  const mSec = secantSlope(fn.f, x0, h);

  return (
    <div>
      <div className="relative">
        <Plane key={String(params.fn)} x={fn.view.x} y={fn.view.y} height={380} squish>
          <Plot.OfX y={fn.f} color={C.fn} weight={3} />

          {showSecant && (
            <>
              {/* Eğim üçgeni: Δx = h ve Δy */}
              <Polygon
                points={[
                  [x0, y0],
                  [x1, y0],
                  [x1, y1],
                ]}
                color={C.hot}
                fillOpacity={0.08}
                weight={0}
              />
              <Line.Segment point1={[x0, y0]} point2={[x1, y0]} color={C.hot} style="dashed" weight={1.5} />
              <Line.Segment point1={[x1, y0]} point2={[x1, y1]} color={C.hot} style="dashed" weight={1.5} />
              {h > 0.25 && (
                <>
                  <Text x={(x0 + x1) / 2} y={y0} attach={y1 >= y0 ? 's' : 'n'} size={13} color={C.hot}>
                    h
                  </Text>
                  <Text x={x1} y={(y0 + y1) / 2} attach="e" size={13} color={C.hot}>
                    Δy
                  </Text>
                </>
              )}
              <Line.ThroughPoints point1={[x0, y0]} point2={[x1, y1]} color={C.hot} weight={2.5} />
            </>
          )}

          {showTangent && <Line.PointSlope point={[x0, y0]} slope={slope} color={C.tan} weight={2.5} />}

          {showSecant && (
            <MovablePoint
              point={[x1, y1]}
              color={C.pt}
              constrain={([x]) => {
                const nx = clamp(x, x0 + H_MIN, x0 + H_MAX);
                return [nx, fn.f(nx)];
              }}
              onMove={([x]) => setParams({ h: clamp(x - x0, H_MIN, H_MAX) })}
            />
          )}
          <MovablePoint
            point={[x0, y0]}
            color={C.ink}
            constrain={([x]) => {
              const nx = snap(clamp(x, -X_LIMIT, X_LIMIT));
              return [nx, fn.f(nx)];
            }}
            onMove={([x]) => setParams({ x0: snap(clamp(x, -X_LIMIT, X_LIMIT)) })}
          />
          <Text x={x0} y={y0} attach="nw" attachDistance={18} size={15} color={C.ink}>
            P
          </Text>
          {showSecant && h > 0.12 && (
            <Text x={x1} y={y1} attach="se" attachDistance={16} size={15} color={C.pt}>
              Q
            </Text>
          )}
        </Plane>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <p className="rounded-md bg-elev/85 px-2 py-1 font-mono text-[12px] text-ink-2 backdrop-blur-sm">
            P ve Q noktalarını sürükle
          </p>
          {showSecant && (
            <button
              type="button"
              onClick={() => animate({ key: 'h', to: H_MIN, durationMs: 2400 })}
              className="pointer-events-auto rounded-md border border-hot bg-elev/90 px-2.5 py-1 font-mono text-[12px] font-medium text-hot backdrop-blur-sm transition-colors hover:bg-hot hover:text-bg"
            >
              h → 0 ▶
            </button>
          )}
        </div>
      </div>

      {showDerivative && (
        <div className="relative border-t border-dashed border-rule-strong">
          <p className="pointer-events-none absolute top-2 left-3 z-10 rounded-md bg-elev/85 px-2 py-1 font-mono text-[12px] text-tan backdrop-blur-sm">
            türev grafiği: y = f′(x)
          </p>
          <Plane key={`d-${String(params.fn)}`} x={fn.view.x} y={fn.derivView} height={210} yStep={2} squish>
            <Plot.OfX y={fn.df} color={C.tan} weight={2.5} />
            <Line.Segment point1={[x0, 0]} point2={[x0, slope]} color={C.tan} style="dashed" />
            <Point x={x0} y={slope} color={C.tan} />
            <Text x={x0} y={slope} attach={slope >= 0 ? 'ne' : 'se'} size={12} color={C.tan}>
              {`eğim = ${fmt(slope)}`}
            </Text>
          </Plane>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {`x₀ = ${fmt(x0)}, kesen eğimi ${fmt(mSec)}, teğet eğimi ${fmt(slope)}`}
      </p>
    </div>
  );
}
