import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { deltaWorks, LIMIT_FUNCTIONS, limitOf } from './model';
import { LimitSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'fn',
    label: 'Fonksiyon',
    default: 'removable',
    options: Object.entries(LIMIT_FUNCTIONS).map(([value, f]) => ({ value, label: f.label })),
  },
  { kind: 'slider', key: 'eps', label: 'ε (y toleransı)', min: 0.05, max: 1, step: 0.05, default: 0.5, tone: '--c-hot' },
  { kind: 'slider', key: 'delta', label: 'δ (x yakınlığı)', min: 0.005, max: 1, step: 0.005, default: 0.6, tone: '--c-fn', format: (v) => fmt(v, 3) },
  { kind: 'toggle', key: 'showBands', label: 'ε ve δ bantlarını göster', default: true },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Grafikte bir delik',
    body: `$f(x) = \\dfrac{x^2-1}{x-1}$ fonksiyonu $x = 1$'de **tanımsız** (0/0). Grafikte o noktada boş bir daire var.

Ama $x$, 1'e yaklaştıkça $f(x)$ neye yaklaşıyor? Alttaki tabloda soldan ve sağdan yaklaşan değerlere bak.`,
    scene: { patch: { fn: 'removable', eps: 0.5, delta: 0.6, showBands: false } },
    sceneLabel: 'Grafiği göster',
  },
  {
    kind: 'predict-number',
    title: 'Limiti tahmin et',
    question: '$\\displaystyle\\lim_{x\\to1}\\frac{x^2-1}{x-1}$ kaçtır?',
    answer: 2,
    tolerance: 0.01,
    setup: { fn: 'removable', showBands: false },
    observe: { patch: { showBands: true, eps: 0.3 }, animate: { key: 'delta', to: 0.25, durationMs: 1800 } },
    explain:
      '$\\dfrac{x^2-1}{x-1} = \\dfrac{(x-1)(x+1)}{x-1} = x + 1$ (x ≠ 1 için). Fonksiyon 1\'de tanımsız olsa da yaklaşınca değeri **2**\'ye gider. Limit, noktadaki değerle değil, **yakınındaki** davranışla ilgilidir.',
  },
  {
    kind: 'explore',
    title: 'ε–δ oyunu',
    body: `Limitin kesin tanımı bir oyundur:

- Rakip bir **ε** seçer: "$f(x)$, L'ye ε'dan yakın olsun."
- Sen bir **δ** bulursun: "$x$, $a$'ya δ'dan yakın olduğu sürece bu sağlanır."

Kırmızı bant $L \\pm \\varepsilon$, mavi bant $a \\pm \\delta$. Mavi bant içindeki kalın grafik parçası tamamen kırmızı bandın içindeyse kazandın (yeşil).`,
    scene: { patch: { fn: 'removable', eps: 0.4, delta: 0.3, showBands: true } },
    sceneLabel: 'Oyunu kur',
  },
  {
    kind: 'predict-choice',
    title: 'ε küçülürse',
    question: 'Rakip ε\'u küçültürse, oyunu kazanmak için δ\'ya ne olmalı?',
    options: ['Büyümeli', 'Küçülmeli', 'Aynı kalabilir', 'δ sıfır olmalı'],
    correctIndex: 1,
    setup: { fn: 'removable', eps: 0.4, delta: 0.3, showBands: true },
    observe: { animate: { key: 'eps', to: 0.1, durationMs: 2200 } },
    explain:
      'Bant daralınca grafik taşar (kırmızıya döndü). Kazanmak için δ\'yı küçült: burada $\\delta \\le \\varepsilon$ yeter. Limit vardır ⇔ **her** ε için böyle bir δ bulunabilir.',
  },
  {
    kind: 'predict-choice',
    title: 'Sıçrama',
    question: 'Sıçramalı fonksiyonda $x \\to 0$ iken limit var mı?',
    options: ['Var, 1\'dir', 'Var, 2\'dir', 'Yok: soldan 1, sağdan 2', 'Var, 1,5\'tir'],
    correctIndex: 2,
    setup: { fn: 'jump', eps: 0.8, delta: 0.5, showBands: true },
    observe: { animate: { key: 'eps', to: 0.25, durationMs: 2200 } },
    explain:
      'Soldan limit 1, sağdan limit 2. Bunlar farklı olduğu için limit **yoktur**: ε < 0,5 seçilince hiçbir δ bandı iki kolu birden içine alamaz. $\\lim f$ var ⇔ sağdan ve soldan limitler var ve **eşit**.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'largest-delta-linear',
    setup: { fn: 'linear', eps: 0.5, delta: 0.6, showBands: true },
    prompt: '$f(x) = 2x + 1$, $a = 1$: $\\varepsilon = 0{,}1$ için çalışan **en büyük** δ\'yı bul.',
    check: (p) => {
      if (str(p, 'fn') !== 'linear' || Math.abs(num(p, 'eps') - 0.1) > 1e-9) return false;
      const d = num(p, 'delta');
      return d >= 0.045 - 1e-9 && deltaWorks(LIMIT_FUNCTIONS.linear, 0.1, d).works;
    },
    hints: ['$|f(x) - 3| = |2x - 2| = 2|x - 1|$', '$2\\delta \\le \\varepsilon$ olmalı, yani $\\delta \\le 0{,}05$. Sınırın tam üzerinde eşitlik olur, bir adım geri gel.'],
  },
  {
    id: 'sinc-delta',
    setup: { fn: 'sinc', eps: 0.5, delta: 1, showBands: true },
    prompt: '$\\dfrac{\\sin x}{x}$ için $\\varepsilon = 0{,}05$ iken çalışan ve **en az 0,3** olan bir δ bul.',
    check: (p) => str(p, 'fn') === 'sinc' && Math.abs(num(p, 'eps') - 0.05) < 1e-9 && num(p, 'delta') >= 0.3 && deltaWorks(LIMIT_FUNCTIONS.sinc, 0.05, num(p, 'delta')).works,
    hints: ['Sıfır yakınında $\\dfrac{\\sin x}{x} \\approx 1 - \\dfrac{x^2}{6}$.', '$\\dfrac{\\delta^2}{6} < 0{,}05 \\Rightarrow \\delta < 0{,}55$'],
  },
  {
    id: 'removable-delta',
    setup: { fn: 'removable', eps: 0.5, delta: 0.6, showBands: true },
    prompt: 'Delikli fonksiyonda $\\varepsilon = 0{,}2$ için çalışan **en büyük** δ\'yı bul (±0,01).',
    check: (p) => {
      if (str(p, 'fn') !== 'removable' || Math.abs(num(p, 'eps') - 0.2) > 1e-9) return false;
      const d = num(p, 'delta');
      return d >= 0.19 - 1e-9 && deltaWorks(LIMIT_FUNCTIONS.removable, 0.2, d).works;
    },
    hints: ['x ≠ 1 için $f(x) = x + 1$.', '$|f(x) - 2| = |x - 1| < \\delta$ — δ, ε kadar olabilir.'],
  },
];

export const limitModule: SimulationModule = {
  id: 'limit-epsilon-delta',
  params,
  Component: LimitSimulation,
  lesson,
  challenges,
  solver: 'limit',
  formula: (p) => {
    const fn = limitOf(p.fn);
    const eps = num(p, 'eps');
    const delta = num(p, 'delta');
    const lim = fn.L === null ? `\\nexists \\;(${tex(fn.left)} \\ne ${tex(fn.right)})` : tex(fn.L);
    return `\\begin{aligned}
&\\lim_{x\\to ${tex(fn.a)}} ${fn.L === null ? 'f(x)' : fn.tex} = ${lim} \\\\[4pt]
&0 < |x - ${tex(fn.a)}| < ${tex(delta, 3)} \\;\\Rightarrow\\; |f(x) - ${tex(fn.L ?? fn.right)}| < ${tex(eps)}
\\end{aligned}`;
  },
  readouts: (p) => {
    const fn = limitOf(p.fn);
    const eps = num(p, 'eps');
    const delta = num(p, 'delta');
    const { works, worst } = deltaWorks(fn, eps, delta);
    return [
      { label: 'Limit L', value: fn.L === null ? 'yok' : fmt(fn.L), tone: '--c-tan' },
      { label: 'Sol / sağ limit', value: `${fmt(fn.left)} / ${fmt(fn.right)}` },
      { label: 'ε', value: fmt(eps), tone: '--c-hot' },
      { label: 'δ', value: fmt(delta, 3), tone: '--c-fn' },
      { label: 'En büyük sapma', value: fmt(worst, 4) },
      { label: 'Durum', value: works ? '✓ δ yeterli' : '✗ yetersiz', tone: works ? '--c-tan' : '--c-hot' },
    ];
  },
};

export default limitModule;
