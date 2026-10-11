import { Line, MovablePoint, Plot, Polygon, Text, Vector } from 'mafs';
import { fmt } from '../../core/math/format';
import { StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { str, type SimProps } from '../../core/types';
import { add, angle, cross, dot, project, vecsOf } from './model';

const VIEW: [number, number] = [-6, 6];
const snap = (v: number) => Math.max(-5.5, Math.min(5.5, Math.round(v * 2) / 2));

export function VectorSimulation({ params, setParams }: SimProps) {
  const mode = str(params, 'mode');
  const { u, v } = vecsOf(params);
  const s = add(u, v);
  const proj = project(v, u);
  const theta = angle(u, v);
  const cz = cross(u, v);
  const a0 = Math.atan2(u[1], u[0]);
  const a1 = Math.atan2(v[1], v[0]);
  // Açı yayı u'dan v'ye en kısa yoldan çizilir.
  let delta = a1 - a0;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  return (
    <div className="relative">
      <Plane x={VIEW} y={VIEW} height={460}>
        {mode === 'add' && (
          <>
            <Line.Segment point1={u} point2={s} color={C.fn} style="dashed" weight={1.5} />
            <Line.Segment point1={v} point2={s} color={C.hot} style="dashed" weight={1.5} />
            <Vector tip={s} color={C.tan} weight={4} />
            <Text x={s[0]} y={s[1]} attach="ne" attachDistance={12} size={14} color={C.tan}>
              u + v
            </Text>
          </>
        )}
        {mode === 'dot' && (
          <>
            <Line.Segment point1={[-8 * u[0], -8 * u[1]]} point2={[8 * u[0], 8 * u[1]]} color={C.ink3} style="dashed" weight={1} />
            <Line.Segment point1={v} point2={proj} color={C.ink3} style="dashed" weight={1.5} />
            <Vector tip={proj} color={C.tan} weight={5} />
            <Text x={proj[0]} y={proj[1]} attach="s" attachDistance={14} size={13} color={C.tan}>
              izdüşüm
            </Text>
            {Math.abs(delta) > 0.02 && (
              <Plot.Parametric xy={(t) => [0.8 * Math.cos(a0 + t * delta), 0.8 * Math.sin(a0 + t * delta)]} domain={[0, 1]} color={C.pt} weight={2.5} />
            )}
          </>
        )}
        {mode === 'cross' && (
          <Polygon points={[[0, 0], u, s, v]} color={cz >= 0 ? C.pt : C.hot} fillOpacity={0.3} weight={1.5} />
        )}

        <Vector tip={u} color={C.hot} weight={3.5} />
        <Vector tip={v} color={C.fn} weight={3.5} />
        <Text x={u[0]} y={u[1]} attach="se" attachDistance={14} size={15} color={C.hot}>
          u
        </Text>
        <Text x={v[0]} y={v[1]} attach="nw" attachDistance={14} size={15} color={C.fn}>
          v
        </Text>
        <MovablePoint point={u} color={C.hot} onMove={([x, y]) => setParams({ ux: snap(x), uy: snap(y) })} />
        <MovablePoint point={v} color={C.fn} onMove={([x, y]) => setParams({ vx: snap(x), vy: snap(y) })} />
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        {mode === 'add' && <StageNote>paralelkenar kuralı: u + v köşegendir</StageNote>}
        {mode === 'dot' && (
          <StageNote>
            u·v = {fmt(dot(u, v))} · θ = {fmt((theta * 180) / Math.PI, 1)}°{Math.abs(dot(u, v)) < 1e-9 ? ' · dik!' : ''}
          </StageNote>
        )}
        {mode === 'cross' && (
          <StageNote tone={cz >= 0 ? 'text-pt' : 'text-hot'}>
            alan = |u × v| = {fmt(Math.abs(cz))} · yön {cz > 0 ? '⊙ (sayfadan dışarı)' : cz < 0 ? '⊗ (sayfanın içine)' : 'yok'}
          </StageNote>
        )}
      </div>
    </div>
  );
}

