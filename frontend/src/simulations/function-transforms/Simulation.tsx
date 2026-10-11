import { Line, MovablePoint, Plot, Point, Text } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { str, type SimProps } from '../../core/types';
import { baseOf, quadraticOf, transformed, transformOf } from './model';

const VIEW: [number, number] = [-6, 6];
const snap = (v: number) => Math.round(v * 2) / 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function TransformSimulation(props: SimProps) {
  return str(props.params, 'mode') === 'quadratic' ? <QuadraticView {...props} /> : <TransformView {...props} />;
}

function TransformView({ params, setParams }: SimProps) {
  const base = baseOf(params.base);
  const t = transformOf(params);
  const g = transformed(base.f, t);
  const anchorY = t.abs ? Math.abs(t.v) : t.v;

  return (
    <div className="relative">
      <Plane key="t" x={VIEW} y={VIEW} height={440}>
        <Plot.OfX y={base.f} color={C.ink3} style="dashed" weight={2} />
        <Plot.OfX y={g} color={C.fn} weight={3.2} />
        {t.h !== 0 && <Line.Segment point1={[0, anchorY]} point2={[t.h, anchorY]} color={C.hot} style="dashed" weight={1.5} />}
        {t.v !== 0 && <Line.Segment point1={[0, 0]} point2={[0, anchorY]} color={C.hot} style="dashed" weight={1.5} />}
        <MovablePoint
          point={[t.h, anchorY]}
          color={C.hot}
          onMove={([x, y]) => setParams({ h: clamp(snap(x), -4, 4), v: clamp(snap(y), -4, 4) })}
        />
        <Text x={t.h} y={anchorY} attach="ne" attachDistance={14} size={13} color={C.hot}>
          {`(${fmt(t.h)}, ${fmt(anchorY)})`}
        </Text>
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        <StageNote>kesikli: f(x) = {base.label} · mavi: g(x)</StageNote>
        <StageNote tone="text-hot">kırmızı noktayı sürükle</StageNote>
      </div>
    </div>
  );
}

function QuadraticView({ params, setParams }: SimProps) {
  const q = quadraticOf(params);
  const f = (x: number) => q.a * x * x + q.b * x + q.c;
  const [vx, vy] = q.vertex;
  const hasVertex = Number.isFinite(vx);

  return (
    <div className="relative">
      <Plane key="q" x={VIEW} y={VIEW} height={440}>
        {hasVertex && <Line.Segment point1={[vx, -6]} point2={[vx, 6]} color={C.ink3} style="dashed" weight={1.2} />}
        <Plot.OfX y={f} color={C.fn} weight={3.2} />
        <Point x={0} y={q.c} color={C.ink} />
        {q.roots.map((r) => (
          <Point key={r} x={r} y={0} color={C.hot} />
        ))}
        {hasVertex && (
          <>
            <MovablePoint
              point={[vx, vy]}
              color={C.pt}
              onMove={([x, y]) => {
                const r = clamp(snap(x), -5, 5);
                const k = clamp(snap(y), -6, 6);
                // Tepe (r, k) sabit a ile: b = −2ar, c = ar² + k
                setParams({ qb: -2 * q.a * r, qc: q.a * r * r + k });
              }}
            />
            <Text x={vx} y={vy} attach={q.a > 0 ? 's' : 'n'} attachDistance={18} size={13} color={C.pt}>
              {`T(${fmt(vx)}, ${fmt(vy)})`}
            </Text>
          </>
        )}
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        <StageNote>
          Δ = {fmt(q.delta)} → {q.delta > 1e-12 ? 'iki farklı gerçek kök' : Math.abs(q.delta) <= 1e-12 ? 'çakışık kök (teğet)' : 'gerçek kök yok'}
        </StageNote>
        <StageNote tone="text-pt">tepe noktasını sürükle</StageNote>
      </div>
    </div>
  );
}
