import { fmt } from '../../core/math/format';
import { StageButton, StageNote } from '../../core/plot/Charts';
import { useWidth } from '../../core/plot/theme';
import { bool, type SimProps } from '../../core/types';
import { CITIES, cityName, graphState, ROADS } from './model';

const H = 440;

export function GraphSimulation({ params, setParams, animate }: SimProps) {
  const st = graphState(params);
  const { snap, path, alg } = st;
  const showWeights = bool(params, 'showWeights');
  const { ref, width } = useWidth<HTMLDivElement>();

  const lons = CITIES.map((c) => c.lon);
  const lats = CITIES.map((c) => c.lat);
  const pad = 56;
  const sx = (lon: number) => pad + ((lon - Math.min(...lons)) / (Math.max(...lons) - Math.min(...lons))) * (width - 2 * pad);
  const sy = (lat: number) => pad + 10 + ((Math.max(...lats) - lat) / (Math.max(...lats) - Math.min(...lats))) * (H - 2 * pad - 10);
  const pos = Object.fromEntries(CITIES.map((c) => [c.id, [sx(c.lon), sy(c.lat)] as const]));

  const onPath = (a: string, b: string) => path.some((p, i) => i > 0 && ((path[i - 1] === a && p === b) || (path[i - 1] === b && p === a)));
  const treeEdge = (a: string, b: string) => snap.prev[a] === b || snap.prev[b] === a;

  return (
    <div className="relative" ref={ref}>
      <svg width={width} height={H} role="img" aria-label={`${alg === 'bfs' ? 'BFS' : 'Dijkstra'} algoritması, ${st.step}. adım`}>
        {ROADS.map(([a, b, w]) => {
          const [x1, y1] = pos[a];
          const [x2, y2] = pos[b];
          const hot = onPath(a, b);
          const tree = treeEdge(a, b);
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={hot ? 'var(--c-tan)' : tree ? 'var(--c-fn)' : 'var(--rule-strong)'}
                strokeWidth={hot ? 5 : tree ? 2.6 : 1.6}
                strokeLinecap="round"
                strokeOpacity={hot || tree ? 1 : 0.9}
              />
              {showWeights && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10.5"
                  fill="var(--ink-3)"
                  paintOrder="stroke"
                  stroke="var(--bg-elev)"
                  strokeWidth="3"
                >
                  {w}
                </text>
              )}
            </g>
          );
        })}
        {CITIES.map((c) => {
          const [x, y] = pos[c.id];
          const done = snap.done.includes(c.id);
          const frontier = snap.frontier.includes(c.id);
          const current = snap.current === c.id;
          const d = snap.dist[c.id];
          const isTarget = c.id === st.target;
          return (
            <g key={c.id}>
              {isTarget && <circle cx={x} cy={y} r={20} fill="none" stroke="var(--c-tan)" strokeWidth="2" strokeDasharray="4 3" />}
              <circle
                cx={x}
                cy={y}
                r={current ? 14 : 11}
                fill={current ? 'var(--c-pt)' : done ? 'var(--c-fn)' : 'var(--bg-elev)'}
                stroke={frontier ? 'var(--c-hot)' : done ? 'var(--c-fn)' : 'var(--ink-3)'}
                strokeWidth={frontier ? 3 : 2}
              />
              <text x={x} y={y - 19} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600" fill="var(--ink)" paintOrder="stroke" stroke="var(--bg-elev)" strokeWidth="4">
                {c.name}
              </text>
              {Number.isFinite(d) && (
                <text x={x} y={y + 27} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={done ? 'var(--c-fn)' : 'var(--c-hot)'} paintOrder="stroke" stroke="var(--bg-elev)" strokeWidth="3">
                  {alg === 'bfs' ? `${d} adım` : `${fmt(d, 0)} km`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          <StageNote>
            {alg === 'bfs' ? 'BFS' : 'Dijkstra'} · adım {st.step}/{st.snaps.length - 1}
            {snap.current ? ` · kesinleşen: ${cityName(snap.current)}` : ''}
          </StageNote>
          {path.length > 0 && (
            <StageNote tone="text-tan">
              yol: {path.map(cityName).join(' → ')}
            </StageNote>
          )}
        </div>
        <div className="flex gap-2">
          <StageButton onClick={() => setParams((p) => ({ step: Math.min(st.snaps.length - 1, Math.round(Number(p.step)) + 1) }))}>+1 adım</StageButton>
          <StageButton onClick={() => animate({ key: 'step', to: st.snaps.length - 1, durationMs: 3500 })}>sona kadar ▶</StageButton>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 px-4 pb-3 font-mono text-[12px] text-ink-2">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-fn align-middle" /> kesinleşti
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-hot align-middle" /> sınırda (kuyrukta)
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-pt align-middle" /> şu an işlenen
        </span>
        <span className="text-ink-3">mesafeler yaklaşıktır</span>
      </div>
    </div>
  );
}
