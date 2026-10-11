import { Line, MovablePoint, Polygon, Text, Vector } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { apply, det, eigen, matrixOf, PRESETS, type Vec } from './model';

const VIEW: Vec = [-5, 5];
const snap = (v: number) => Math.max(-3, Math.min(3, Math.round(v * 4) / 4));
const GRID = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

export function LinearSimulation({ params, setParams }: SimProps) {
  const m = matrixOf(params);
  const v: Vec = [num(params, 'vx'), num(params, 'vy')];
  const Av = apply(m, v);
  const i = apply(m, [1, 0]);
  const j = apply(m, [0, 1]);
  const D = det(m);
  const e = eigen(m);
  const showEigen = bool(params, 'showEigen');
  const showGrid = bool(params, 'showGrid');

  return (
    <div className="relative">
      <Plane x={VIEW} y={VIEW} height={460}>
        {showGrid &&
          GRID.map((k) => (
            <g key={k}>
              <Line.Segment point1={apply(m, [k, -6])} point2={apply(m, [k, 6])} color={C.fn} opacity={k === 0 ? 0.55 : 0.2} weight={k === 0 ? 2 : 1} />
              <Line.Segment point1={apply(m, [-6, k])} point2={apply(m, [6, k])} color={C.fn} opacity={k === 0 ? 0.55 : 0.2} weight={k === 0 ? 2 : 1} />
            </g>
          ))}
        <Polygon points={[[0, 0], i, [i[0] + j[0], i[1] + j[1]], j]} color={D < 0 ? C.hot : C.pt} fillOpacity={0.28} weight={1.5} />

        {showEigen &&
          e.real &&
          e.vectors.map((ev, k) => (
            <g key={k}>
              <Line.Segment point1={[-8 * ev[0], -8 * ev[1]]} point2={[8 * ev[0], 8 * ev[1]]} color={C.pt} style="dashed" weight={2} />
              <Text x={4.2 * ev[0]} y={4.2 * ev[1]} attach="e" size={13} color={C.pt}>
                {`λ = ${fmt(e.values[k])}`}
              </Text>
            </g>
          ))}

        <Vector tip={v} color={C.ink3} weight={2} />
        <Vector tip={Av} color={C.ink} weight={3} />
        <Vector tip={i} color={C.hot} weight={3.5} />
        <Vector tip={j} color={C.tan} weight={3.5} />
        <Text x={i[0]} y={i[1]} attach="se" attachDistance={14} size={15} color={C.hot}>
          î′
        </Text>
        <Text x={j[0]} y={j[1]} attach="nw" attachDistance={14} size={15} color={C.tan}>
          ĵ′
        </Text>
        <Text x={Av[0]} y={Av[1]} attach="ne" attachDistance={12} size={13} color={C.ink}>
          A·v
        </Text>

        <MovablePoint point={i} color={C.hot} onMove={([x, y]) => setParams({ a: snap(x), c: snap(y) })} />
        <MovablePoint point={j} color={C.tan} onMove={([x, y]) => setParams({ b: snap(x), d: snap(y) })} />
        <MovablePoint point={v} color={C.ink3} onMove={([x, y]) => setParams({ vx: snap(x), vy: snap(y) })} />
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <StageNote tone={D < 0 ? 'text-hot' : 'text-ink-2'}>
          alan × {fmt(Math.abs(D))} {D < 0 ? '· yönelim ters' : D === 0 ? '· düzlem çöktü' : ''}
        </StageNote>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setParams({ ...p.m })}
              className="rounded-md border border-rule-strong bg-elev/90 px-2 py-0.5 font-mono text-[11px] text-ink-2 backdrop-blur-sm hover:border-ink hover:text-ink"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
