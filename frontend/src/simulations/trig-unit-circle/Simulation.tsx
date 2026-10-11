import { Line, MovablePoint, Plot, Point, Text } from 'mafs';
import { useEffect } from 'react';
import { fmt, fmtPi } from '../../core/math/format';
import { C as COLOR, Plane } from '../../core/plot/Plane';
import { bool, num, type SimProps } from '../../core/types';
import { circlePoint, TAU, thetaFromCircleAngle, waveOf, waveY } from './wave';

/** Çemberin merkezi solda sabit durur; dalga x = 0'dan başlar. */
export const CX = -3.4;
const VIEW_X: [number, number] = [-6, TAU + 0.3];
const VIEW_Y: [number, number] = [-4.1, 4.1];
const SPEED = 0.9; // radyan / saniye

const xLabel = (x: number) => (x > 0.01 ? fmtPi(x) : x > -0.01 ? '0' : '');

export function TrigSimulation({ params, setParams }: SimProps) {
  const w = waveOf(params);
  const theta = num(params, 'theta');
  const playing = bool(params, 'playing');
  const showCos = bool(params, 'showCos');
  const showTan = bool(params, 'showTan');

  // "Döndür": θ sürekli artar, 2π'de başa döner.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setParams((p) => ({ theta: (Number(p.theta) + dt * SPEED) % TAU }));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, setParams]);

  const R = Math.abs(w.A);
  const [px, py] = circlePoint(w, theta, CX);
  const yTheta = waveY(w, theta);
  const wave = (x: number) => waveY(w, x);

  // Çember üzerindeki gerçek açı (A < 0 ise P ters taraftadır).
  const alpha = (((Math.atan2(py - w.D, px - CX) % TAU) + TAU) % TAU);
  const arcR = Math.max(0.28, 0.32 * R);

  const tanValue = Math.tan(alpha);
  const tanVisible = showTan && R > 0 && Math.abs(Math.cos(alpha)) > 0.08 && Math.abs(R * tanValue) < 3.9;

  return (
    <div className="relative">
      <Plane x={VIEW_X} y={VIEW_Y} height={420} xStep={Math.PI / 2} xLabels={xLabel}>
        {/* Çemberin kendi eksenleri */}
        <Line.Segment point1={[CX - R - 0.35, w.D]} point2={[CX + R + 0.35, w.D]} color={COLOR.ink3} weight={1} />
        <Line.Segment point1={[CX, w.D - R - 0.35]} point2={[CX, w.D + R + 0.35]} color={COLOR.ink3} weight={1} />
        <Plot.Parametric xy={(t) => [CX + R * Math.cos(t), w.D + R * Math.sin(t)]} domain={[0, TAU]} color={COLOR.ink} weight={2} />

        {/* Açı yayı */}
        {alpha > 0.02 && (
          <Plot.Parametric
            xy={(t) => [CX + arcR * Math.cos(t), w.D + arcR * Math.sin(t)]}
            domain={[0, alpha]}
            color={COLOR.pt}
            weight={2.5}
          />
        )}

        {/* tan: çemberin sağındaki dikey teğet üzerinde */}
        {tanVisible && (
          <>
            <Line.Segment point1={[CX, w.D]} point2={[CX + R, w.D + R * tanValue]} color={COLOR.tan} style="dashed" weight={1.5} />
            <Line.Segment point1={[CX + R, w.D]} point2={[CX + R, w.D + R * tanValue]} color={COLOR.tan} weight={4} />
          </>
        )}

        {/* Yarıçap ve izdüşümler */}
        <Line.Segment point1={[CX, w.D]} point2={[px, py]} color={COLOR.ink} weight={1.5} />
        <Line.Segment point1={[CX, w.D]} point2={[px, w.D]} color={COLOR.fn} weight={4.5} />
        <Line.Segment point1={[px, w.D]} point2={[px, py]} color={COLOR.hot} weight={4.5} />

        {/* Dalga */}
        {Math.abs(w.D) > 1e-9 && <Line.Segment point1={[0, w.D]} point2={[TAU, w.D]} color={COLOR.ink3} style="dashed" weight={1} />}
        {showCos && <Plot.OfX y={Math.cos} domain={[0, TAU]} color={COLOR.fn} style="dashed" weight={2} />}
        <Plot.OfX y={wave} domain={[0, TAU]} color={COLOR.hot} weight={2} opacity={0.28} />
        {theta > 0.005 && <Plot.OfX y={wave} domain={[0, theta]} color={COLOR.hot} weight={3.5} />}

        {/* P ile dalga noktasını bağlayan "aha" çizgisi */}
        <Line.Segment point1={[px, py]} point2={[theta, yTheta]} color={COLOR.ink3} style="dashed" weight={1.5} />
        <Line.Segment point1={[theta, w.D]} point2={[theta, yTheta]} color={COLOR.hot} style="dashed" weight={1.5} />
        <Point x={theta} y={yTheta} color={COLOR.hot} />

        <MovablePoint
          point={[px, py]}
          color={COLOR.ink}
          constrain={([x, y]) => {
            if (R === 0) return [CX, w.D];
            const a = Math.atan2(y - w.D, x - CX);
            return [CX + R * Math.cos(a), w.D + R * Math.sin(a)];
          }}
          onMove={([x, y]) => {
            const a = Math.atan2(y - w.D, x - CX);
            setParams((p) => ({ playing: false, theta: thetaFromCircleAngle(a, waveOf(p), Number(p.theta)) }));
          }}
        />
        <Text x={px} y={py} attach={py >= w.D ? 'n' : 's'} attachDistance={18} size={15} color={COLOR.ink}>
          P
        </Text>
        {showCos && (
          <Text x={TAU} y={1} attach="w" size={12} color={COLOR.fn}>
            cos x
          </Text>
        )}
      </Plane>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <p className="rounded-md bg-elev/85 px-2 py-1 font-mono text-[12px] text-ink-2 backdrop-blur-sm">
          θ = {fmt((theta * 180) / Math.PI, 0)}° · P'yi çember üzerinde sürükle
        </p>
        <button
          type="button"
          onClick={() => setParams({ playing: !playing })}
          aria-pressed={playing}
          className="pointer-events-auto rounded-md border border-hot bg-elev/90 px-2.5 py-1 font-mono text-[12px] font-medium text-hot backdrop-blur-sm transition-colors hover:bg-hot hover:text-bg"
        >
          {playing ? '❚❚ Durdur' : '▶ Döndür'}
        </button>
      </div>
    </div>
  );
}
