import { Line, MovablePoint, Point, Polyline } from 'mafs';
import { useMemo } from 'react';
import { fmt } from '../../core/math/format';
import { LineChart, PanelTitle, StageNote } from '../../core/plot/Charts';
import { C, Plane } from '../../core/plot/Plane';
import { bool, num, str, type SimProps } from '../../core/types';
import { euler, lotka, LV_TIME, rk4, sir, SIR_DAYS, type Pt } from './model';
import { eqOf } from './model';

const VIEWS: Record<string, { x: [number, number]; y: [number, number] }> = {
  exp: { x: [-0.5, 3], y: [-0.5, 9] },
  linear: { x: [-1, 5], y: [-2, 5] },
  logistic: { x: [-0.5, 8], y: [-0.5, 5.5] },
};

export function DESimulation(props: SimProps) {
  const mode = str(props.params, 'mode');
  if (mode === 'sir') return <SirView {...props} />;
  if (mode === 'lotka') return <LotkaView {...props} />;
  return <SlopeView {...props} />;
}

function SlopeView({ params, setParams }: SimProps) {
  const key = str(params, 'eq');
  const eq = eqOf(key);
  const view = VIEWS[key] ?? VIEWS.exp;
  const x0 = num(params, 'x0');
  const y0 = num(params, 'y0');
  const h = num(params, 'h');
  const showEuler = bool(params, 'showEuler');

  const field = useMemo(() => {
    const [xa, xb] = view.x;
    const [ya, yb] = view.y;
    const segs: [Pt, Pt][] = [];
    const nx = 16;
    const ny = 12;
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        const x = xa + ((xb - xa) * i) / nx;
        const y = ya + ((yb - ya) * j) / ny;
        const m = eq.f(x, y);
        // Ekranda eşit uzunlukta görünsün diye yönü normalize edilmiş koordinatlarda hesapla.
        const ux = 1 / (xb - xa);
        const uy = m / (yb - ya);
        const r = Math.hypot(ux, uy) || 1;
        const L = 0.022;
        const dx = (ux / r) * L * (xb - xa);
        const dy = (uy / r) * L * (yb - ya);
        segs.push([
          [x - dx, y - dy],
          [x + dx, y + dy],
        ]);
      }
    }
    return segs;
  }, [eq, view]);

  const exact = useMemo(() => {
    const fwd = rk4(eq.f, x0, y0, 0.01, view.x[1]);
    const back = rk4(eq.f, x0, y0, 0.01, view.x[0]).reverse();
    return [...back, ...fwd.slice(1)].filter(([, y]) => y > view.y[0] - 20 && y < view.y[1] + 20);
  }, [eq, x0, y0, view]);

  const eul = showEuler ? euler(eq.f, x0, y0, h, view.x[1]) : [];
  const visibleEuler = eul.filter(([, y]) => y < view.y[1] + 20);

  return (
    <div className="relative">
      <Plane key={key} x={view.x} y={view.y} height={440} squish>
        {field.map(([a, b], i) => (
          <Line.Segment key={i} point1={a} point2={b} color={C.ink3} weight={1.4} />
        ))}
        {exact.length > 1 && <Polyline points={exact} color={C.fn} weight={3} fillOpacity={0} />}
        {visibleEuler.length > 1 && (
          <>
            <Polyline points={visibleEuler} color={C.hot} weight={2} fillOpacity={0} />
            {visibleEuler.length < 60 && visibleEuler.map(([x, y], i) => <Point key={i} x={x} y={y} color={C.hot} />)}
          </>
        )}
        <MovablePoint
          point={[x0, y0]}
          color={C.pt}
          onMove={([x, y]) => setParams({ x0: Math.round(x * 10) / 10, y0: Math.round(y * 10) / 10 })}
        />
      </Plane>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-3">
        <StageNote>{eq.label} · gri çizgiler: her noktadaki eğim</StageNote>
        <StageNote tone="text-fn">mavi: gerçek çözüm</StageNote>
        {showEuler && <StageNote tone="text-hot">kırmızı: Euler (h = {fmt(h, 3)})</StageNote>}
      </div>
    </div>
  );
}

function SirView({ params }: SimProps) {
  const beta = num(params, 'beta');
  const gamma = num(params, 'gamma');
  const r = useMemo(() => sir(beta, gamma), [beta, gamma]);
  const series = (j: number) => r.traj.map((s, k): [number, number] => [k * r.dt, s[j]]);
  return (
    <div className="relative">
      <div className="px-3 pt-3">
        <StageNote>
          R₀ = β/γ = {fmt(beta / gamma, 2)} · tepe: %{fmt(r.peak * 100, 1)} ({fmt(r.peakDay, 0)}. gün)
        </StageNote>
      </div>
      <div className="px-2 pt-2 pb-2">
        <LineChart
          ariaLabel="SIR modeli: duyarlı, enfekte, iyileşen oranları"
          height={380}
          x={[0, SIR_DAYS]}
          y={[0, 1]}
          xLabel="gün"
          yFormat={(v) => `%${fmt(v * 100, 0)}`}
          series={[
            { points: series(0), color: 'var(--c-fn)', width: 2.6 },
            { points: series(1), color: 'var(--c-hot)', width: 3 },
            { points: series(2), color: 'var(--c-tan)', width: 2.6 },
          ]}
          markers={[{ x: r.peakDay, y: r.peak, color: 'var(--c-hot)' }]}
        />
        <div className="flex flex-wrap gap-4 px-3 pb-1 font-mono text-[12px]">
          <span className="text-fn">● S: duyarlı</span>
          <span className="text-hot">● I: enfekte</span>
          <span className="text-tan">● R: iyileşen</span>
        </div>
      </div>
    </div>
  );
}

function LotkaView({ params }: SimProps) {
  const a = num(params, 'alpha');
  const b = num(params, 'lb');
  const d = num(params, 'delta');
  const g = num(params, 'lg');
  const x0 = num(params, 'prey0');
  const y0 = num(params, 'pred0');
  const { traj, dt } = useMemo(() => lotka(a, b, d, g, x0, y0), [a, b, d, g, x0, y0]);
  const every = 5;
  const thin = traj.filter((_, k) => k % every === 0);
  const prey = thin.map((s, k): [number, number] => [k * every * dt, s[0]]);
  const pred = thin.map((s, k): [number, number] => [k * every * dt, s[1]]);
  const phase = thin.map((s): [number, number] => [s[0], s[1]]);
  const max = Math.max(...thin.flatMap((s) => s)) * 1.1;
  return (
    <div className="relative">
      <div className="px-3 pt-3">
        <StageNote>
          denge: av = γ/δ = {fmt(g / d, 2)}, avcı = α/β = {fmt(a / b, 2)}
        </StageNote>
      </div>
      <div className="grid gap-0 lg:grid-cols-[3fr_2fr]">
        <div className="px-2 pt-2">
          <LineChart
            ariaLabel="Av ve avcı nüfuslarının zamanla değişimi"
            height={300}
            x={[0, LV_TIME]}
            y={[0, max]}
            xLabel="zaman"
            series={[
              { points: prey, color: 'var(--c-fn)', width: 2.6 },
              { points: pred, color: 'var(--c-hot)', width: 2.6 },
            ]}
          />
          <div className="flex gap-4 px-3 pb-2 font-mono text-[12px]">
            <span className="text-fn">● av (tavşan)</span>
            <span className="text-hot">● avcı (tilki)</span>
          </div>
        </div>
        <div className="border-t border-dashed border-rule-strong lg:border-t-0 lg:border-l">
          <PanelTitle>Faz portresi · av – avcı</PanelTitle>
          <div className="px-2 pb-2">
            <LineChart
              ariaLabel="Faz portresi"
              height={280}
              x={[0, max]}
              y={[0, max]}
              xLabel="av"
              yLabel="avcı"
              series={[{ points: phase, color: 'var(--c-tan)', width: 2.2 }]}
              markers={[
                { x: g / d, y: a / b, color: 'var(--c-pt)' },
                { x: x0, y: y0, color: 'var(--ink)' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
