import { useMemo } from 'react';
import { fmt } from '../../core/math/format';
import { CanvasStage, type DrawContext } from '../../core/plot/CanvasStage';
import { BarChart, LineChart, PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { bool, num, str, type SimProps } from '../../core/types';
import { binomialPmf, diceExpected, diceRun, galtonRun, montyRun, type MontyGame } from './model';

export const trialsOf = (p: Record<string, unknown>) => Math.max(1, Math.round(Number(p.trials)));

export function ProbabilitySimulation(props: SimProps) {
  const exp = str(props.params, 'experiment');
  const reseed = () => props.setParams((p) => ({ seed: Number(p.seed) + 1 }));
  return (
    <div className="relative">
      {exp === 'galton' ? <GaltonView {...props} /> : exp === 'monty' ? <MontyView {...props} /> : <DiceView {...props} />}
      <div className="pointer-events-none absolute top-0 right-0 flex gap-2 p-3">
        <StageButton onClick={reseed}>↻ Yeniden at</StageButton>
        <StageButton onClick={() => props.animate({ key: 'trials', to: 5000, durationMs: 3500 })}>5000 deneme ▶</StageButton>
      </div>
    </div>
  );
}

function DiceView({ params }: SimProps) {
  const trials = trialsOf(params);
  const r = useMemo(() => diceRun(num(params, 'seed'), trials), [params.seed, trials]); // eslint-disable-line react-hooks/exhaustive-deps
  const freqs = r.counts.map((c) => c / trials);
  return (
    <div>
      <div className="px-3 pt-14 pb-1">
        <StageNote>{trials} atış · çubuk: gözlenen sıklık · kırmızı: kuramsal olasılık</StageNote>
      </div>
      <div className="px-2">
        <BarChart
          ariaLabel="İki zar toplamının dağılımı"
          height={250}
          yMax={0.2}
          bars={freqs.map((v, i) => ({ label: String(i + 2), value: v, highlight: i === 5 }))}
          expected={diceExpected}
          yFormat={(v) => fmt(v, 2)}
        />
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Büyük sayılar yasası · “toplam = 7” sıklığı</PanelTitle>
        <div className="px-2 pb-2">
          <LineChart
            ariaLabel="7 gelme sıklığının deneme sayısıyla değişimi"
            height={170}
            x={[0, Math.max(10, trials)]}
            y={[0, 0.4]}
            series={[{ points: r.running7, color: 'var(--c-pt)', width: 2.2 }]}
            refLines={[{ y: 1 / 6, color: 'var(--c-hot)', label: '1/6' }]}
            xFormat={(v) => fmt(v, 0)}
            xLabel="deneme"
          />
        </div>
      </div>
    </div>
  );
}

function GaltonView({ params }: SimProps) {
  const trials = trialsOf(params);
  const rows = Math.round(num(params, 'rows'));
  const p = num(params, 'p');
  const r = useMemo(() => galtonRun(num(params, 'seed'), trials, rows, p), [params.seed, trials, rows, p]); // eslint-disable-line react-hooks/exhaustive-deps
  const expected = useMemo(() => binomialPmf(rows, p).map((q) => q * trials), [rows, p, trials]);

  const draw = ({ ctx, width, height, colors }: DrawContext) => {
    const cx = width / 2;
    const dx = Math.min((width * 0.86) / (rows + 1), 38);
    const top = 64;
    const pegH = Math.min(18, (height * 0.42) / rows);
    const binTop = top + rows * pegH + 26;
    const binBottom = height - 22;
    const xAt = (k: number, r: number) => cx + (k - r / 2) * dx;

    // Çiviler
    ctx.fillStyle = colors.ink3;
    for (let row = 0; row < rows; row++) {
      for (let j = 0; j <= row; j++) {
        ctx.beginPath();
        ctx.arc(xAt(j, row), top + row * pegH, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Son topların yolları
    ctx.lineWidth = 1.4;
    r.paths.forEach((path, i) => {
      ctx.strokeStyle = colors.hot;
      ctx.globalAlpha = 0.25 + (0.6 * (i + 1)) / r.paths.length;
      ctx.beginPath();
      ctx.moveTo(cx, top - pegH);
      path.forEach((k, row) => ctx.lineTo(xAt(k, row), top + row * pegH - pegH / 2));
      ctx.lineTo(xAt(path[path.length - 1], rows), binTop - 4);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Kutular
    const maxVal = Math.max(1, ...r.bins, ...expected);
    const scale = (binBottom - binTop) / maxVal;
    const bw = dx * 0.82;
    const stackBalls = maxVal <= 24;
    r.bins.forEach((count, k) => {
      const x = xAt(k, rows);
      if (stackBalls) {
        const rad = Math.min(bw / 2, ((binBottom - binTop) / 24) * 0.5);
        ctx.fillStyle = colors.fn;
        for (let b = 0; b < count; b++) {
          ctx.beginPath();
          ctx.arc(x, binBottom - rad - b * rad * 2, rad * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = colors.fn;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x - bw / 2, binBottom - count * scale, bw, count * scale);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = colors.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - dx / 2, binTop);
      ctx.lineTo(x - dx / 2, binBottom);
      ctx.stroke();
    });
    // Kuramsal binom eğrisi
    ctx.strokeStyle = colors.hot;
    ctx.fillStyle = colors.hot;
    ctx.lineWidth = 2;
    ctx.beginPath();
    expected.forEach((e, k) => {
      const x = xAt(k, rows);
      const y = binBottom - e * scale;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    expected.forEach((e, k) => {
      ctx.beginPath();
      ctx.arc(xAt(k, rows), binBottom - e * scale, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = colors.ink3;
    ctx.beginPath();
    ctx.moveTo(xAt(0, rows) - dx / 2, binBottom);
    ctx.lineTo(xAt(rows, rows) + dx / 2, binBottom);
    ctx.stroke();
    ctx.fillStyle = colors.ink3;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    r.bins.forEach((_, k) => {
      if (rows <= 12 || k % 2 === 0) ctx.fillText(String(k), xAt(k, rows), binBottom + 15);
    });
  };

  return (
    <div className="relative">
      <CanvasStage height={460} draw={draw} ariaLabel={`Galton tahtası: ${trials} top, ${rows} sıra çivi`} />
      <div className="pointer-events-none absolute top-0 left-0 p-3">
        <StageNote>
          {trials} top · {rows} sıra · sağa sapma olasılığı p = {fmt(p)}
        </StageNote>
      </div>
    </div>
  );
}

function Door({ index, game }: { index: number; game: MontyGame | null }) {
  const isCar = game?.car === index;
  const opened = game?.opened === index;
  const picked = game?.pick === index;
  const final = game?.final === index;
  const revealed = opened || final;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-36 w-24 items-end justify-center rounded-t-lg border-2 pb-3 text-4xl transition-colors sm:h-40 sm:w-28 ${
          final ? (game?.win ? 'border-tan bg-tan/10' : 'border-hot bg-hot/10') : opened ? 'border-rule bg-sunk' : 'border-ink-3 bg-elev'
        }`}
      >
        <span className="absolute top-2 font-mono text-[12px] text-ink-3">{index + 1}</span>
        {revealed ? <span aria-label={isCar ? 'araba' : 'keçi'}>{isCar ? '🚗' : '🐐'}</span> : <span className="mb-6 h-2 w-2 rounded-full bg-ink-3" />}
      </div>
      <p className="h-4 font-mono text-[11px] text-ink-2">{final ? (picked ? 'kaldı' : 'değiştirdi') : picked ? 'ilk seçim' : opened ? 'sunucu açtı' : ''}</p>
    </div>
  );
}

function MontyView({ params }: SimProps) {
  const trials = trialsOf(params);
  const switchDoor = bool(params, 'montySwitch');
  const r = useMemo(() => montyRun(num(params, 'seed'), trials, switchDoor), [params.seed, trials, switchDoor]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <div className="px-3 pt-14">
        <StageNote>
          Son oyun · strateji: <strong className="text-ink">{switchDoor ? 'değiştir' : 'kal'}</strong> · {r.last?.win ? 'kazandı 🎉' : 'kaybetti'}
        </StageNote>
      </div>
      <div className="flex justify-center gap-4 py-5 sm:gap-8">
        {[0, 1, 2].map((d) => (
          <Door key={d} index={d} game={r.last} />
        ))}
      </div>
      <div className="border-t border-dashed border-rule-strong">
        <PanelTitle>Kazanma oranı · {trials} oyun</PanelTitle>
        <div className="px-2 pb-2">
          <LineChart
            ariaLabel="Kazanma oranının oyun sayısıyla değişimi"
            height={180}
            x={[0, Math.max(10, trials)]}
            y={[0, 1]}
            series={[{ points: r.running, color: switchDoor ? 'var(--c-tan)' : 'var(--c-fn)', width: 2.4 }]}
            refLines={[
              { y: 2 / 3, color: 'var(--c-tan)', label: '2/3' },
              { y: 1 / 3, color: 'var(--c-fn)', label: '1/3' },
            ]}
            xFormat={(v) => fmt(v, 0)}
            xLabel="oyun"
          />
        </div>
      </div>
    </div>
  );
}
