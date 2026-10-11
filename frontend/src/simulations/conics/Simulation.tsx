import { Line, MovablePoint, Plot, Point, Text } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { conicOf, dist, paramFromPoint, type Pt } from './model';

const VIEW_X: Pt = [-9, 9];
const VIEW_Y: Pt = [-6.5, 6.5];

export function ConicSimulation({ params, setParams }: SimProps) {
  const c = conicOf(params);
  const showReflection = bool(params, 'showReflection');
  const showDirectrix = bool(params, 'showDirectrix');
  const P = c.point;
  const [F1, F2] = c.foci;
  const a = num(params, 'a');
  const b = num(params, 'b');

  const tangentLine = (len: number): [Pt, Pt] => [
    [P[0] - c.tangent[0] * len, P[1] - c.tangent[1] * len],
    [P[0] + c.tangent[0] * len, P[1] + c.tangent[1] * len],
  ];

  return (
    <div className="relative">
      <Plane key={c.type} x={VIEW_X} y={VIEW_Y} height={460}>
        {c.type === 'ellipse' && <Plot.Parametric xy={(t) => [a * Math.cos(t), b * Math.sin(t)]} domain={[0, 2 * Math.PI]} color={C.fn} weight={3} />}
        {c.type === 'hyperbola' && (
          <>
            <Plot.Parametric xy={(u) => [a * Math.cosh(u), b * Math.sinh(u)]} domain={[-2.6, 2.6]} color={C.fn} weight={3} />
            <Plot.Parametric xy={(u) => [-a * Math.cosh(u), b * Math.sinh(u)]} domain={[-2.6, 2.6]} color={C.fn} weight={3} />
            <Plot.OfX y={(x) => (b / a) * x} color={C.ink3} style="dashed" weight={1} />
            <Plot.OfX y={(x) => (-b / a) * x} color={C.ink3} style="dashed" weight={1} />
          </>
        )}
        {c.type === 'parabola' && <Plot.OfX y={(x) => (x * x) / (4 * c.p)} color={C.fn} weight={3} />}

        {showDirectrix && c.type === 'parabola' && (
          <>
            <Line.Segment point1={[-9, c.directrix]} point2={[9, c.directrix]} color={C.pt} style="dashed" weight={2} />
            <Line.Segment point1={P} point2={[P[0], c.directrix]} color={C.pt} weight={2} />
          </>
        )}
        {showDirectrix && c.type !== 'parabola' && Number.isFinite(c.directrix) && Math.abs(c.directrix) < 30 && (
          <>
            {(c.type === 'hyperbola' || a >= b) && (
              <>
                <Line.Segment point1={[c.directrix, -7]} point2={[c.directrix, 7]} color={C.pt} style="dashed" weight={2} />
                <Line.Segment point1={[-c.directrix, -7]} point2={[-c.directrix, 7]} color={C.pt} style="dashed" weight={1.2} />
                <Line.Segment point1={P} point2={[c.directrix, P[1]]} color={C.pt} weight={2} />
              </>
            )}
          </>
        )}

        {showReflection && c.type === 'parabola' && (
          <>
            <Line.Segment point1={[P[0], 7]} point2={P} color={C.pt} weight={2} />
            <Line.Segment point1={P} point2={F1} color={C.pt} weight={2} />
          </>
        )}
        {showReflection && <Line.Segment point1={tangentLine(3)[0]} point2={tangentLine(3)[1]} color={C.ink3} style="dashed" weight={1.5} />}

        {c.type !== 'parabola' && (
          <>
            <Line.Segment point1={P} point2={F1} color={C.hot} weight={2.4} />
            <Line.Segment point1={P} point2={F2} color={C.tan} weight={2.4} />
          </>
        )}
        {c.type === 'parabola' && !showReflection && <Line.Segment point1={P} point2={F1} color={C.hot} weight={2.4} />}

        {c.foci.map((f, i) => (
          <g key={i}>
            <Point x={f[0]} y={f[1]} color={C.hot} />
            <Text x={f[0]} y={f[1]} attach="s" attachDistance={14} size={13} color={C.hot}>
              {c.foci.length > 1 ? `F${i === 0 ? '₁' : '₂'}` : 'F'}
            </Text>
          </g>
        ))}
        <MovablePoint
          point={P}
          color={C.ink}
          constrain={([x, y]) => {
            const t = paramFromPoint(c.type, a, b, [c.type === 'hyperbola' ? Math.abs(x) : x, y]);
            return conicOf({ ...params, t }).point;
          }}
          onMove={([x, y]) => setParams({ t: paramFromPoint(c.type, a, b, [x, y]) })}
        />
        <Text x={P[0]} y={P[1]} attach="ne" attachDistance={14} size={15} color={C.ink}>
          P
        </Text>
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        {c.type === 'ellipse' && (
          <StageNote>
            PF₁ + PF₂ = {fmt(dist(P, F1), 2)} + {fmt(dist(P, F2), 2)} = <strong className="text-ink">{fmt(dist(P, F1) + dist(P, F2), 2)}</strong>
          </StageNote>
        )}
        {c.type === 'hyperbola' && (
          <StageNote>
            |PF₁ − PF₂| = <strong className="text-ink">{fmt(Math.abs(dist(P, F1) - dist(P, F2)), 2)}</strong>
          </StageNote>
        )}
        {c.type === 'parabola' && (
          <StageNote>
            PF = {fmt(dist(P, F1), 2)} · P'den doğrultmana = {fmt(P[1] - c.directrix, 2)}
          </StageNote>
        )}
        <StageNote tone="text-ink-2">P'yi eğri üzerinde sürükle</StageNote>
      </div>
    </div>
  );
}
