import { fmt } from '../../core/math/format';
import { LineChart, PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { useWidth } from '../../core/plot/theme';
import { num, type SimProps } from '../../core/types';
import { partialSums, seriesOf } from './model';

/** Kısmi toplamların sayı doğrusunda zıplaması: her terim bir yay. */
function NumberLine({ sums, limit }: { sums: number[]; limit: number | null }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const shown = sums.slice(0, 60);
  const values = [0, ...shown, ...(limit !== null ? [limit] : [])];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.06 || 1;
  const sx = (v: number) => 24 + ((v - lo + pad) / (hi - lo + 2 * pad)) * (width - 48);
  const y = 92;
  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={130} role="img" aria-label="Kısmi toplamların sayı doğrusundaki konumları">
        <line x1={16} x2={width - 16} y1={y} y2={y} stroke="var(--ink-3)" />
        {[lo, 0, hi].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
          <text key={v} x={sx(v)} y={y + 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-3)">
            {fmt(v, 2)}
          </text>
        ))}
        {limit !== null && (
          <g>
            <line x1={sx(limit)} x2={sx(limit)} y1={14} y2={y + 6} stroke="var(--c-hot)" strokeDasharray="4 3" strokeWidth="1.5" />
            <text x={sx(limit)} y={11} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--c-hot)">
              limit
            </text>
          </g>
        )}
        {shown.map((s, k) => {
          const prev = k === 0 ? 0 : shown[k - 1];
          const x0 = sx(prev);
          const x1 = sx(s);
          const h = Math.max(6, Math.min(56, Math.abs(x1 - x0) * 0.55));
          return (
            <path
              key={k}
              d={`M${x0} ${y} Q${(x0 + x1) / 2} ${y - h * 1.6} ${x1} ${y}`}
              fill="none"
              stroke={s >= prev ? 'var(--c-fn)' : 'var(--c-tan)'}
              strokeWidth={k < 3 ? 2.2 : 1.4}
              strokeOpacity={Math.max(0.25, 1 - k / 40)}
            />
          );
        })}
        {shown.length > 0 && <circle cx={sx(shown[shown.length - 1])} cy={y} r="5" fill="var(--c-pt)" stroke="var(--bg-elev)" strokeWidth="1.5" />}
      </svg>
    </div>
  );
}

export function SeriesSimulation({ params, animate }: SimProps) {
  const s = seriesOf(params);
  const N = Math.max(1, Math.round(num(params, 'N')));
  const sums = partialSums(s.term, N);
  const points = sums.map((v, i): [number, number] => [i + 1, v]);
  const all = [...sums, ...(s.limit !== null ? [s.limit] : []), 0];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo) * 0.1 || 0.5;
  const current = sums[N - 1];

  return (
    <div className="relative">
      <div className="px-3 pt-14">
        <StageNote>
          S<sub>{N}</sub> = {fmt(current, 5)}
          {s.limit !== null ? ` · limite uzaklık ${fmt(Math.abs(s.limit - current), 5)}` : ' · seri ıraksak'}
        </StageNote>
      </div>
      <div className="px-2">
        <LineChart
          ariaLabel="Kısmi toplamlar"
          height={250}
          x={[1, Math.max(5, N)]}
          y={[lo - pad, hi + pad]}
          xFormat={(v) => fmt(v, 0)}
          xLabel="n"
          yLabel="Sₙ"
          series={[{ points, color: 'var(--c-fn)', width: 2.4 }]}
          refLines={s.limit !== null ? [{ y: s.limit, color: 'var(--c-hot)', label: 'limit' }] : []}
          markers={[{ x: N, y: current, color: 'var(--c-pt)' }]}
        />
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Sayı doğrusunda kısmi toplamlar · her yay bir terim</PanelTitle>
        <div className="px-2 pb-2">
          <NumberLine sums={sums} limit={s.limit} />
        </div>
      </div>
      <div className="pointer-events-none absolute top-0 right-0 p-3">
        <StageButton onClick={() => animate({ key: 'N', to: 100, durationMs: 3500 })}>n → 100 ▶</StageButton>
      </div>
    </div>
  );
}
