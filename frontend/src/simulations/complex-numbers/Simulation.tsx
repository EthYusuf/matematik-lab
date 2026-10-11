import { Circle, Line, MovablePoint, Plot, Point, Polygon, Text, Vector } from 'mafs';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { num, str, type SimProps } from '../../core/types';
import { cabs, cadd, carg, cmul, cpow, cstr, roots, zOf, type Cx } from './model';

const VIEW: [number, number] = [-5, 5];
const snap = (v: number) => Math.max(-3, Math.min(3, Math.round(v * 2) / 2));

function Arc({ from, to, r, color }: { from: number; to: number; r: number; color: string }) {
  if (Math.abs(to - from) < 0.02) return null;
  return <Plot.Parametric xy={(t) => [r * Math.cos(from + t * (to - from)), r * Math.sin(from + t * (to - from))]} domain={[0, 1]} color={color} weight={2.5} />;
}

const positive = (t: number) => (t < 0 ? t + 2 * Math.PI : t);

export function ComplexSimulation({ params, setParams }: SimProps) {
  const op = str(params, 'op');
  const n = Math.round(num(params, 'n'));
  const { z1, z2 } = zOf(params);
  const sum = cadd(z1, z2);
  const prod = cmul(z1, z2);
  const powers: Cx[] = Array.from({ length: n + 1 }, (_, k) => cpow(z1, k));
  const rts = roots(z1, n);

  return (
    <div className="relative">
      <Plane x={VIEW} y={VIEW} height={460} xLabels={(v) => (v === 0 ? '0' : String(v))} yLabels={(v) => (v === 0 ? '' : `${v}i`)}>
        <Circle center={[0, 0]} radius={1} color={C.ink3} fillOpacity={0} weight={1.2} svgEllipseProps={{ strokeDasharray: '4 4' }} />

        {op === 'add' && (
          <>
            <Line.Segment point1={z1} point2={sum} color={C.fn} style="dashed" weight={1.5} />
            <Line.Segment point1={z2} point2={sum} color={C.hot} style="dashed" weight={1.5} />
            <Vector tip={sum} color={C.tan} weight={4} />
            <Text x={sum[0]} y={sum[1]} attach="ne" attachDistance={12} size={14} color={C.tan}>
              z₁ + z₂
            </Text>
          </>
        )}

        {op === 'mul' && (
          <>
            <Arc from={0} to={positive(carg(z1))} r={0.6} color={C.hot} />
            <Arc from={0} to={positive(carg(z2))} r={0.85} color={C.fn} />
            <Arc from={0} to={positive(carg(z1)) + positive(carg(z2))} r={1.15} color={C.tan} />
            <Vector tip={prod} color={C.tan} weight={4} />
            <Text x={prod[0]} y={prod[1]} attach="ne" attachDistance={12} size={14} color={C.tan}>
              z₁·z₂
            </Text>
          </>
        )}

        {op === 'pow' && (
          <>
            <Line.Segment point1={[0, 0]} point2={powers[1]} color={C.ink3} weight={1} />
            {powers.slice(1).map((p, k) => (
              <g key={k}>
                {k > 0 && <Line.Segment point1={powers[k]} point2={p} color={C.tan} weight={2} opacity={0.75} />}
                <Point x={p[0]} y={p[1]} color={k === n - 1 ? C.tan : C.ink3} />
                {cabs(p) < 5 && (
                  <Text x={p[0]} y={p[1]} attach="ne" attachDistance={10} size={12} color={k === n - 1 ? C.tan : C.ink3}>
                    {`z${k + 1 === 1 ? '' : superscript(k + 1)}`}
                  </Text>
                )}
              </g>
            ))}
          </>
        )}

        {op === 'roots' && (
          <>
            <Circle center={[0, 0]} radius={cabs(rts[0])} color={C.tan} fillOpacity={0} weight={1} />
            {n > 2 && <Polygon points={rts} color={C.tan} fillOpacity={0.12} weight={2} />}
            {rts.map((r, k) => (
              <Point key={k} x={r[0]} y={r[1]} color={C.tan} />
            ))}
          </>
        )}

        <Vector tip={z1} color={C.hot} weight={3.5} />
        <Text x={z1[0]} y={z1[1]} attach="se" attachDistance={14} size={15} color={C.hot}>
          z₁
        </Text>
        <MovablePoint point={z1} color={C.hot} onMove={([x, y]) => setParams({ ar: snap(x), ai: snap(y) })} />
        {(op === 'add' || op === 'mul') && (
          <>
            <Vector tip={z2} color={C.fn} weight={3.5} />
            <Text x={z2[0]} y={z2[1]} attach="nw" attachDistance={14} size={15} color={C.fn}>
              z₂
            </Text>
            <MovablePoint point={z2} color={C.fn} onMove={([x, y]) => setParams({ br: snap(x), bi: snap(y) })} />
          </>
        )}
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        {op === 'mul' && <StageNote>açılar toplanır · uzunluklar çarpılır</StageNote>}
        {op === 'pow' && <StageNote>z, z², z³ … bir sarmal çizer</StageNote>}
        {op === 'roots' && <StageNote>zⁿ = z₁ denkleminin {n} kökü: düzgün {n}-gen</StageNote>}
        {op === 'add' && <StageNote>toplama = vektör toplama</StageNote>}
        <StageNote tone="text-tan">sonuç: {op === 'add' ? cstr(sum) : op === 'mul' ? cstr(prod) : op === 'pow' ? cstr(powers[n]) : `${n} kök`}</StageNote>
      </div>
    </div>
  );
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (k: number) => String(k).replace(/\d/g, (d) => SUP[Number(d)]);
