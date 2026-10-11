import { useMemo } from 'react';
import { fmt } from '../../core/math/format';
import { BarChart, LineChart, PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { bool, num, type SimProps } from '../../core/types';
import { describe, histogram, normalCdf, populationOf, sampleMeans } from './model';

const BINS = 36;

export const cltState = (p: Record<string, unknown>) => {
  const pop = populationOf(p.dist);
  const n = Math.max(1, Math.round(Number(p.n)));
  const m = Math.max(10, Math.round(Number(p.m)));
  return { pop, n, m, seed: Number(p.seed) };
};

export function CltSimulation({ params, setParams, animate }: SimProps) {
  const { pop, n, m, seed } = cltState(params);
  const showNormal = bool(params, 'showNormal');
  const means = useMemo(() => sampleMeans(pop, n, m, seed), [pop, n, m, seed]);
  const stats = describe(means);
  const [lo, hi] = pop.range;
  const w = (hi - lo) / BINS;
  const counts = histogram(means, pop.range, BINS);
  const se = pop.sigma / Math.sqrt(n);
  const expected = showNormal ? counts.map((_, k) => m * (normalCdf((lo + (k + 1) * w - pop.mu) / se) - normalCdf((lo + k * w - pop.mu) / se))) : undefined;
  const density = Array.from({ length: 121 }, (_, i): [number, number] => {
    const x = lo - 0.05 * (hi - lo) + (i / 120) * 1.1 * (hi - lo);
    return [x, pop.density(x)];
  });
  const dMax = Math.max(...density.map((d) => d[1])) * 1.15;

  return (
    <div className="relative">
      <div className="px-3 pt-14">
        <StageNote>
          {m} örneklem × n = {n} · her çubuk: örneklem ortalamalarının sıklığı · {num(params, 'n') >= 30 ? 'çan eğrisi oturdu' : 'n\'yi artır'}
        </StageNote>
      </div>
      <div className="px-2">
        <BarChart
          ariaLabel="Örneklem ortalamalarının histogramı"
          height={260}
          bars={counts.map((c, k) => ({ label: k % 6 === 0 ? fmt(lo + (k + 0.5) * w, 1) : '', value: c }))}
          expected={expected}
          labelEvery={1}
          yFormat={(v) => fmt(v, 0)}
        />
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Nüfus dağılımı · μ = {fmt(pop.mu, 2)}, σ = {fmt(pop.sigma, 3)}</PanelTitle>
        <div className="px-2 pb-2">
          <LineChart
            ariaLabel="Nüfus dağılımının yoğunluk fonksiyonu"
            height={120}
            x={[density[0][0], density[density.length - 1][0]]}
            y={[0, dMax]}
            yTicks={[0]}
            series={[{ points: density, color: 'var(--c-hot)', width: 2.4 }]}
            refLines={[{ x: pop.mu, color: 'var(--c-pt)' }]}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute top-0 right-0 flex gap-2 p-3">
        <StageButton onClick={() => setParams((p) => ({ seed: Number(p.seed) + 1 }))}>↻ Yeniden örnekle</StageButton>
        <StageButton onClick={() => animate({ key: 'n', to: 30, durationMs: 3200 })}>n → 30 ▶</StageButton>
      </div>
      <span className="sr-only">{`Ortalamaların ortalaması ${fmt(stats.mean, 3)}, standart sapması ${fmt(stats.sd, 3)}`}</span>
    </div>
  );
}
