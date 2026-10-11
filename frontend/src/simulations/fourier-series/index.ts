import { fmt } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { fourierState, rmsError, WAVES } from './model';
import { FourierSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'wave',
    label: 'Hedef dalga',
    default: 'square',
    options: Object.entries(WAVES).map(([value, w]) => ({ value, label: w.label })),
  },
  { kind: 'slider', key: 'N', label: 'Harmonik sayısı N', min: 1, max: 60, step: 1, default: 1, tone: '--c-hot', format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 't', label: 'Zaman t', min: 0, max: 2 * Math.PI, step: 0.01, default: 1.2, tone: '--c-pt', format: (v) => `${fmt(v / Math.PI, 2)}π` },
  { kind: 'toggle', key: 'playing', label: 'Döndür (animasyon)', default: false },
  { kind: 'toggle', key: 'showTarget', label: 'Hedef dalgayı göster', default: true },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Tek bir sinüs',
    body: `Kesikli çizgi bir **kare dalga**: köşeli, ani sıçramalı. Kırmızı eğri ise onu taklit etmeye çalışan tek bir sinüs: $\\frac{4}{\\pi}\\sin t$.

Fourier'nin fikri: **her** periyodik dalga, farklı frekanslı sinüslerin toplamıdır.`,
    scene: { patch: { wave: 'square', N: 1, t: 1.2, playing: false } },
    sceneLabel: 'Tek harmonik',
  },
  {
    kind: 'predict-choice',
    title: 'Harmonik ekle',
    question: 'Daha fazla harmonik (sinüs) ekledikçe ne olur?',
    options: [
      'Toplam tam olarak kare dalgaya dönüşür, hiç hata kalmaz',
      'Köşeler keskinleşir ama sıçramanın yanında, sıçrama yüksekliğinin ~%9\'u kadar bir taşma hep kalır',
      'Dalga giderek düzleşir',
      'Değişmez',
    ],
    correctIndex: 1,
    setup: { wave: 'square', N: 1, t: 1.2, playing: false },
    observe: { animate: { key: 'N', to: 49, durationMs: 4200 } },
    explain:
      'Yaklaşım her yerde iyileşir ama sıçramanın hemen yanında, sıçrama yüksekliğinin yaklaşık **%9**\'u kadar bir "boynuz" kalır (tepe 1 yerine ≈ 1,18): **Gibbs olayı**. JPEG ve MP3 sıkıştırmasındaki halka bozulmaları da buradan gelir.',
  },
  {
    kind: 'explore',
    title: 'Dönen çemberler',
    body: `Her harmonik, kendi hızıyla dönen bir **çember**: 1. harmonik en büyük ve en yavaş, 3. harmonik 3 kat hızlı ve 3'te bir büyüklükte…

Çemberleri uç uca ekle: zincirin ucu, dalgayı çizer. **Döndür**'e bas. (Bu fikirle her türlü kapalı şekil çizilebilir!)`,
    scene: { patch: { wave: 'square', N: 7, playing: true } },
    sceneLabel: '4 çemberle oynat',
  },
  {
    kind: 'predict-choice',
    title: 'Hangi harmonikler?',
    question: 'Kare dalganın serisinde hangi harmonikler bulunur?',
    options: ['Hepsi (1, 2, 3, 4, …)', 'Yalnızca tek sayılı (1, 3, 5, …)', 'Yalnızca çift sayılı', 'Yalnızca 1.'],
    correctIndex: 1,
    setup: { wave: 'square', N: 2, playing: false },
    observe: { animate: { key: 'N', to: 8, durationMs: 2500 } },
    explain: 'N = 2, 4, 6 iken çember sayısı artmadı: çift katsayılar **sıfır**. Kare dalganın yarım periyot simetrisi ($f(t + \\pi) = -f(t)$) çift harmonikleri yok eder.',
  },
  {
    kind: 'predict-number',
    title: 'Genlik oranı',
    question: 'Kare dalgada 3. harmoniğin genliği, 1.\'nin kaçta kaçıdır?',
    answer: 1 / 3,
    tolerance: 0.01,
    setup: { wave: 'square', N: 3, playing: false },
    observe: { patch: { t: 0.5 } },
    explain: '$b_k = \\frac{4}{k\\pi}$ → $\\frac{b_3}{b_1} = \\frac13$. Genlikler $\\frac1k$ hızıyla azalır; üçgen dalgada $\\frac{1}{k^2}$ — bu yüzden üçgen çok daha az harmonikle iyi taklit edilir.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'square-rms',
    setup: { wave: 'square', N: 1, playing: false },
    prompt: 'Kare dalgayı **RMS hatası 0,15**\'in altında kalacak kadar iyi taklit et — ama gereğinden fazla harmonik kullanma (N ≤ 25).',
    check: (p) => str(p, 'wave') === 'square' && num(p, 'N') <= 25 && rmsError(WAVES.square, Math.round(num(p, 'N'))) < 0.15,
    hints: ['Hata yavaş azalır (∝ 1/√N).', 'N ≈ 19 civarına bak.'],
  },
  {
    id: 'saw-rms',
    setup: { wave: 'sawtooth', N: 1, playing: false },
    prompt: '**Testere** dalgasının RMS hatasını **0,1**\'in altına indir.',
    check: (p) => str(p, 'wave') === 'sawtooth' && rmsError(WAVES.sawtooth, Math.round(num(p, 'N'))) < 0.1,
    hints: ['Testere dalgası tüm harmonikleri kullanır.', 'Yaklaşık 20\'den fazla harmonik gerekir.'],
  },
  {
    id: 'triangle-two',
    setup: { wave: 'triangle', N: 1, playing: false },
    prompt: '**Üçgen** dalgayı yalnızca **iki sıfırdan farklı** harmonikle, RMS hata **0,05** altında olacak şekilde çiz.',
    check: (p) => {
      const s = fourierState(p);
      return str(p, 'wave') === 'triangle' && s.nonzero === 2 && rmsError(WAVES.triangle, s.N) < 0.05;
    },
    hints: ['Üçgen dalgada da yalnızca tek harmonikler var.', 'N = 3: 1. ve 3. harmonik.'],
  },
];

export const fourierModule: SimulationModule = {
  id: 'fourier-series',
  params,
  Component: FourierSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { w, N } = fourierState(p);
    return `\\begin{aligned}&f(t) \\approx \\sum_{k=1}^{${N}} b_k \\sin(kt) \\\\[3pt]&${w.btex}\\end{aligned}`;
  },
  readouts: (p) => {
    const s = fourierState(p);
    const rms = rmsError(s.w, s.N, 800);
    return [
      { label: 'Sıfırdan farklı harmonik', value: String(s.nonzero), tone: '--c-hot' },
      { label: 'b₁', value: fmt(s.w.b(1), 4) },
      { label: `Son katsayı (k = ${s.N})`, value: fmt(s.w.b(s.N), 4) },
      { label: 'RMS hata', value: fmt(rms, 4), tone: '--c-tan' },
      { label: 'f(t)', value: fmt(s.f(num(p, 't')), 4), tone: '--c-pt' },
    ];
  },
};

export default fourierModule;

