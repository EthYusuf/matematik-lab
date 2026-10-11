import { secantSlope } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { FUNCTIONS, fnOf } from './functions';
import { DerivativeSimulation, H_MAX, H_MIN } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'fn',
    label: 'Fonksiyon f(x)',
    default: 'square',
    options: Object.entries(FUNCTIONS).map(([value, f]) => ({ value, label: f.label })),
  },
  { kind: 'slider', key: 'x0', label: 'Nokta x₀', min: -2.5, max: 2.5, step: 0.01, default: 1, tone: '--ink' },
  {
    kind: 'slider',
    key: 'h',
    label: 'Aralık h',
    min: H_MIN,
    max: H_MAX,
    step: 0.001,
    default: 1.5,
    scale: 'log',
    tone: '--c-hot',
    format: (v) => fmt(v, 3),
    hint: 'Logaritmik: küçük h değerlerine ince ayar yapabilirsin.',
  },
  { kind: 'toggle', key: 'showSecant', label: 'Kesen doğrusu', default: true },
  { kind: 'toggle', key: 'showTangent', label: 'Teğet doğrusu', default: false },
  { kind: 'toggle', key: 'showDerivative', label: 'Türev grafiği f′(x)', default: false },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Eğim: iki nokta, bir doğru',
    body: `Mavi eğri $f(x)=x^2$. Üzerinde iki nokta var: **P** $(x_0,\\,f(x_0))$ ve **Q** $(x_0+h,\\,f(x_0+h))$.

İkisinden geçen turuncu doğruya **kesen** denir. Eğimi, yükselmenin ilerlemeye oranıdır: $\\dfrac{\\Delta y}{h}$.

P ve Q'yu sürükle; eğimin nasıl değiştiğini sağdaki panelden izle.`,
    scene: { patch: { fn: 'square', x0: 1, h: 1.5, showSecant: true, showTangent: false, showDerivative: false } },
    sceneLabel: 'Başlangıca kur',
  },
  {
    kind: 'predict-choice',
    title: 'Q, P\'ye yaklaşırsa?',
    question: 'h küçüldükçe (Q noktası P\'ye yaklaştıkça) turuncu kesen doğrusu ne olur?',
    options: [
      'Giderek dikleşir ve sonunda dikey olur',
      'Eğriye P noktasında "dokunan" tek bir doğruya yerleşir',
      'Kaybolur, çünkü iki nokta çakışır',
      'Hiçbir şey değişmez',
    ],
    correctIndex: 1,
    setup: { fn: 'square', x0: 1, h: 1.5, showSecant: true, showTangent: false, showDerivative: false },
    observe: { patch: { showTangent: true }, animate: { key: 'h', to: H_MIN, durationMs: 2600 } },
    explain: `Q, P'ye yaklaştıkça kesen döner ve yeşil **teğet** doğrusuna oturur. Teğetin eğimi, kesen eğimlerinin limitidir:

$$f'(x_0)=\\lim_{h\\to 0}\\frac{f(x_0+h)-f(x_0)}{h}$$

Türevin tanımı tam olarak budur.`,
  },
  {
    kind: 'predict-number',
    title: 'Teğetin eğimini tahmin et',
    question: '$f(x)=x^2$ için $x_0=1$ noktasındaki teğetin eğimi kaçtır?',
    answer: 2,
    tolerance: 0.05,
    setup: { fn: 'square', x0: 1, h: 1, showSecant: true, showTangent: false, showDerivative: false },
    observe: { patch: { showTangent: true }, animate: { key: 'h', to: H_MIN, durationMs: 2200 } },
    explain: `Kesen eğimi $\\dfrac{(1+h)^2-1}{h} = 2+h$ olur. h → 0 iken bu **2**'ye gider. Genel olarak $(x^2)' = 2x$.`,
  },
  {
    kind: 'explore',
    title: 'Eğim de bir fonksiyondur',
    body: `Her noktanın bir teğet eğimi var. Bu eğimleri bir araya koyunca yeni bir fonksiyon elde edersin: **türev fonksiyonu** $f'(x)$.

Alttaki yeşil grafikte P'yi sürükle: alttaki noktanın **yüksekliği**, üstteki teğetin **eğimine** eşittir.`,
    scene: { patch: { fn: 'cubic', x0: -2, h: H_MIN, showSecant: false, showTangent: true, showDerivative: true } },
    sceneLabel: 'f(x) = x³ − 3x ile göster',
  },
  {
    kind: 'predict-choice',
    title: 'Teğet nerede yatay?',
    question: '$f(x)=x^3-3x$ grafiğinde teğet hangi x değerlerinde **yataydır**?',
    options: ['$x = 0$', '$x = -1$ ve $x = 1$', '$x = -\\sqrt3,\\ 0$ ve $\\sqrt3$', 'Hiçbir yerde'],
    correctIndex: 1,
    setup: { fn: 'cubic', x0: -2, h: H_MIN, showSecant: false, showTangent: true, showDerivative: true },
    observe: { animate: { key: 'x0', to: 1, durationMs: 3000 } },
    explain: `Teğet yatay ⇔ eğim 0 ⇔ $f'(x)=3x^2-3=0$ ⇔ $x=\\pm1$. Bu noktalar grafiğin **tepe** ve **çukur** noktalarıdır (yerel maksimum ve minimum).

Dikkat: $0$ ve $\\pm\\sqrt3$ fonksiyonun **kökleridir** — orada $f(x)=0$, ama $f'(x)\\ne0$.`,
  },
];

const challenges: Challenge[] = [
  {
    id: 'flat-tangent',
    setup: { fn: 'cubic', x0: 2, h: 1, showSecant: false, showTangent: true, showDerivative: false },
    prompt: '$f(x)=x^3-3x$ seçiliyken P\'yi teğetin **yatay** olduğu bir noktaya götür.',
    check: (p) => str(p, 'fn') === 'cubic' && Math.abs(FUNCTIONS.cubic.df(num(p, 'x0'))) < 0.08,
    hints: ['Türev grafiğini aç: yeşil eğri x eksenini nerede kesiyor?', '$f\'(x)=3x^2-3=0$ denklemini çöz.'],
  },
  {
    id: 'steep-descent',
    setup: { fn: 'square', x0: 1, h: 1.5, showSecant: true, showTangent: true, showDerivative: false },
    prompt: 'Herhangi bir fonksiyonda teğetin eğiminin **−1\'den küçük** olduğu (eğrinin hızla düştüğü) bir nokta bul.',
    check: (p) => fnOf(p.fn).df(num(p, 'x0')) < -1,
    hints: ['$x^2$ için eğim $2x$\'tir. Negatif olması için $x_0$ nerede olmalı?', '$x_0 = -1$\'in soluna geç.'],
  },
  {
    id: 'wide-but-accurate',
    setup: { fn: 'square', x0: 1, h: 0.6, showSecant: true, showTangent: true, showDerivative: false },
    prompt: 'Zor görev: $h \\ge 0{,}5$ iken kesen eğimi ile teğet eğimi arasındaki fark **0,02\'den küçük** olsun.',
    check: (p) => {
      const f = fnOf(p.fn);
      const x0 = num(p, 'x0');
      const h = num(p, 'h');
      return h >= 0.5 && Math.abs(secantSlope(f.f, x0, h) - f.df(x0)) < 0.02;
    },
    hints: [
      '$x^2$ için fark her zaman tam olarak h\'dir — bu fonksiyonda imkânsız!',
      'Eğrinin bükülme yönünün değiştiği (dönüm) noktası civarına bak.',
      '$x^3-3x$ için fark $3x_0h+h^2$\'dir. Bunu sıfır yapan $x_0$ yaklaşık $-h/3$.',
    ],
  },
];

export const derivativeModule: SimulationModule = {
  id: 'derivative-tangent',
  params,
  Component: DerivativeSimulation,
  lesson,
  challenges,
  solver: 'derivative',
  formula: (p) => {
    const f = fnOf(p.fn);
    const x0 = num(p, 'x0');
    const h = num(p, 'h');
    return `\\begin{aligned}
f(x) &= ${f.tex} \\qquad f'(x) = ${f.dtex} \\\\[4pt]
m_{\\text{kesen}} &= \\frac{f(x_0+h)-f(x_0)}{h} = ${tex(secantSlope(f.f, x0, h), 3)} \\\\[4pt]
m_{\\text{teğet}} &= f'(${tex(x0)}) = ${tex(f.df(x0), 3)}
\\end{aligned}`;
  },
  readouts: (p) => {
    const f = fnOf(p.fn);
    const x0 = num(p, 'x0');
    const h = num(p, 'h');
    const mSec = secantSlope(f.f, x0, h);
    const mTan = f.df(x0);
    return [
      { label: 'f(x₀)', value: fmt(f.f(x0), 3), tone: '--c-fn' },
      { label: 'Kesen eğimi', value: fmt(mSec, 3), tone: '--c-hot' },
      { label: 'Teğet eğimi f′(x₀)', value: fmt(mTan, 3), tone: '--c-tan' },
      { label: 'Fark', value: fmt(Math.abs(mSec - mTan), 4) },
    ];
  },
};

export default derivativeModule;
