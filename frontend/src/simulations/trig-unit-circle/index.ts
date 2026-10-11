import { near } from '../../core/math/calculus';
import { fmt, fmtPi, piFraction, tex, texPi, toDegrees } from '../../core/math/format';
import { num, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { TrigSimulation } from './Simulation';
import { TAU, waveOf, waveY, type Wave } from './wave';

const PI = Math.PI;

const angleLabel = (v: number) => `${fmt(toDegrees(v), 0)}°${piFraction(v) ? ` · ${fmtPi(v)}` : ''}`;

const params: ParamSchema[] = [
  { kind: 'slider', key: 'theta', label: 'Açı θ', min: 0, max: TAU, step: PI / 180, default: PI / 4, format: angleLabel, tone: '--c-pt' },
  { kind: 'toggle', key: 'playing', label: 'Döndür (animasyon)', default: false },
  { kind: 'slider', key: 'A', label: 'Genlik A', min: -2.5, max: 2.5, step: 0.25, default: 1, tone: '--c-hot' },
  { kind: 'slider', key: 'B', label: 'Frekans B', min: 0.5, max: 4, step: 0.25, default: 1, tone: '--c-hot' },
  { kind: 'slider', key: 'C', label: 'Faz C', min: -PI, max: PI, step: PI / 12, default: 0, format: (v) => fmtPi(v), tone: '--c-hot' },
  { kind: 'slider', key: 'D', label: 'Dikey kayma D', min: -1.5, max: 1.5, step: 0.25, default: 0, tone: '--c-hot' },
  { kind: 'toggle', key: 'showCos', label: 'Referans: y = cos x', default: false },
  { kind: 'toggle', key: 'showTan', label: 'tan değerini göster', default: false },
];

const UNIT = { A: 1, B: 1, C: 0, D: 0, playing: false };

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Birim çember',
    body: `Yarıçapı 1 olan çemberde **P** noktası $\\theta$ açısıyla döner.

- P'nin **yatay** konumu $\\cos\\theta$ (mavi)
- P'nin **dikey** yüksekliği $\\sin\\theta$ (kırmızı)

Sağdaki dalga, P'nin yüksekliğinin zamanla çizdiği izdir. P'yi sürükle ya da **Döndür**'e bas.`,
    scene: { patch: { ...UNIT, theta: PI / 4, showCos: false, showTan: false } },
    sceneLabel: 'Birim çembere dön',
  },
  {
    kind: 'predict-choice',
    title: 'Tepe noktasında',
    question: '$\\theta = \\frac{\\pi}{2}$ (yani 90°) iken $\\sin\\theta$ kaçtır?',
    options: ['$0$', '$1$', '$-1$', '$\\frac12$'],
    correctIndex: 1,
    setup: { ...UNIT, theta: PI / 6 },
    observe: { animate: { key: 'theta', to: PI / 2, durationMs: 1600 } },
    explain:
      '90°\'de P çemberin en tepesindedir: yükseklik = yarıçap = **1**. Yatay konum ise 0\'dır, yani $\\cos 90° = 0$ — mavi çizgi kayboldu.',
  },
  {
    kind: 'predict-choice',
    title: 'Bir tam tur',
    question: 'P bir tam tur atınca ($\\theta$: 0 → $2\\pi$) sağdaki dalga yatayda ne kadar yol alır?',
    options: ['1 birim', '$\\pi$ birim', '$2\\pi$ birim (≈ 6,28)', 'Dalga yatayda ilerlemez'],
    correctIndex: 2,
    setup: { ...UNIT, theta: 0 },
    observe: { animate: { key: 'theta', to: TAU, durationMs: 4200 } },
    explain:
      'Bir tam tur $2\\pi$ radyandır ve dalganın yatay ekseni doğrudan açıdır. Bu yüzden $\\sin$ her $2\\pi$\'de kendini tekrar eder: **periyodu** $2\\pi$\'dir.',
  },
  {
    kind: 'explore',
    title: 'A, B, C, D ne yapar?',
    body: `Genel dalga: $y = A\\sin(Bx + C) + D$

- **A** çemberin yarıçapı → dalganın yüksekliği (genlik)
- **B** dönme hızı → dalganın sıklığı
- **C** başlangıç açısı → dalgayı sağa/sola kaydırır
- **D** çemberi ve dalgayı yukarı/aşağı taşır

Kaydırıcılarla oyna; çemberin değişimiyle dalganın değişimini eşleştir.`,
    scene: { patch: { A: 2, B: 2, C: 0, D: 0, theta: 0, playing: true } },
    sceneLabel: 'A = 2, B = 2 ile oynat',
  },
  {
    kind: 'predict-number',
    title: 'Periyodu bul',
    question: '$y = \\sin(2x)$ dalgasının periyodu kaçtır? ($\\pi$ yazabilirsin)',
    answer: PI,
    tolerance: 0.06,
    setup: { ...UNIT, theta: 0 },
    observe: { patch: { B: 2 }, animate: { key: 'theta', to: PI, durationMs: 2600 } },
    explain:
      'B = 2 iken P iki kat hızlı döner; tam tur için yarı yol yeter: $T = \\dfrac{2\\pi}{B} = \\pi$. Dalga 0 ile $\\pi$ arasında bir kez tamamlandı.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'period-pi-amp-2',
    setup: { ...UNIT },
    prompt: 'Periyodu **$\\pi$**, genliği **2** olan bir dalga oluştur.',
    check: (p) => near(Math.abs(num(p, 'A')), 2, 0.01) && near(num(p, 'B'), 2, 0.01),
    hints: ['Genlik $|A|$\'dır.', 'Periyot $T = \\dfrac{2\\pi}{B}$. $T = \\pi$ olması için B kaç olmalı?'],
  },
  {
    id: 'range-0-3',
    setup: { ...UNIT },
    prompt: 'Dalganın en büyük değeri **3**, en küçük değeri **0** olsun.',
    check: (p) => {
      const A = Math.abs(num(p, 'A'));
      const D = num(p, 'D');
      return near(D + A, 3, 0.01) && near(D - A, 0, 0.01);
    },
    hints: ['Orta çizgi D, en büyük ve en küçük değerin ortalamasıdır.', 'Genlik, en büyük ile en küçük arasındaki farkın yarısıdır.'],
  },
  {
    id: 'sin-to-cos',
    prompt: 'Kırmızı sin dalgasını kesikli mavi **cos x** dalgasının tam üstüne oturt. A = 1, B = 1, D = 0 kalsın; yalnızca **C**\'yi değiştir.',
    setup: { ...UNIT, showCos: true },
    check: (p) =>
      near(num(p, 'A'), 1, 1e-6) && near(num(p, 'B'), 1, 1e-6) && near(num(p, 'D'), 0, 1e-6) && near(num(p, 'C'), PI / 2, 0.01),
    hints: ['C\'yi artırmak dalgayı **sola** kaydırır.', '$\\cos x$, $\\sin x$\'in çeyrek tur (π/2) sola kaymış hâlidir.'],
  },
];

function waveTex({ A, B, C, D }: Wave): string {
  const a = near(A, 1, 1e-9) ? '' : near(A, -1, 1e-9) ? '-' : tex(A);
  const bx = near(B, 1, 1e-9) ? 'x' : `${tex(B)}x`;
  const c = Math.abs(C) < 1e-9 ? '' : C > 0 ? ` + ${texPi(C)}` : ` - ${texPi(-C)}`;
  const d = Math.abs(D) < 1e-9 ? '' : D > 0 ? ` + ${tex(D)}` : ` - ${tex(-D)}`;
  return `y = ${a}\\sin(${bx}${c})${d}`;
}

export const trigModule: SimulationModule = {
  id: 'trig-unit-circle',
  params,
  Component: TrigSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const w = waveOf(p);
    return `\\begin{aligned}
&${waveTex(w)} \\\\[4pt]
&T = \\frac{2\\pi}{|B|} = ${texPi(TAU / w.B)} \\qquad |A| = ${tex(Math.abs(w.A))}
\\end{aligned}`;
  },
  readouts: (p) => {
    const w = waveOf(p);
    const theta = num(p, 'theta');
    const phi = w.B * theta + w.C;
    return [
      { label: 'θ', value: angleLabel(theta), tone: '--c-pt' },
      { label: 'sin(Bθ + C)', value: fmt(Math.sin(phi), 3), tone: '--c-hot' },
      { label: 'cos(Bθ + C)', value: fmt(Math.cos(phi), 3), tone: '--c-fn' },
      { label: 'y(θ)', value: fmt(waveY(w, theta), 3), tone: '--c-hot' },
      { label: 'Periyot T', value: fmtPi(TAU / w.B) },
      { label: 'Değer aralığı', value: `[${fmt(w.D - Math.abs(w.A))}, ${fmt(w.D + Math.abs(w.A))}]` },
    ];
  },
};

export default trigModule;
