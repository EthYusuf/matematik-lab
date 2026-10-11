import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { bool, num, str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { BASES, quadraticOf, quadraticTex, transformOf, transformTex } from './model';
import { TransformSimulation } from './Simulation';

const isTransform = (p: ParamState) => str(p, 'mode') !== 'quadratic';
const isQuadratic = (p: ParamState) => str(p, 'mode') === 'quadratic';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'mode',
    label: 'Mod',
    default: 'transform',
    options: [
      { value: 'transform', label: 'Dönüşümler' },
      { value: 'quadratic', label: 'Parabol ax²+bx+c' },
    ],
  },
  {
    kind: 'select',
    key: 'base',
    label: 'Temel fonksiyon f(x)',
    default: 'square',
    options: Object.entries(BASES).map(([value, b]) => ({ value, label: b.label })),
    visibleWhen: isTransform,
  },
  { kind: 'slider', key: 'h', label: 'Yatay kayma h', min: -4, max: 4, step: 0.5, default: 0, tone: '--c-hot', visibleWhen: isTransform },
  { kind: 'slider', key: 'v', label: 'Dikey kayma v', min: -4, max: 4, step: 0.5, default: 0, tone: '--c-hot', visibleWhen: isTransform },
  { kind: 'slider', key: 'k', label: 'Dikey ölçek k', min: -3, max: 3, step: 0.25, default: 1, tone: '--c-fn', visibleWhen: isTransform },
  { kind: 'slider', key: 'm', label: 'Yatay ölçek m', min: 0.25, max: 3, step: 0.25, default: 1, tone: '--c-fn', visibleWhen: isTransform },
  { kind: 'toggle', key: 'flipX', label: 'y eksenine göre yansıt: f(−x)', default: false, visibleWhen: isTransform },
  { kind: 'toggle', key: 'absOuter', label: 'Mutlak değer: |g(x)|', default: false, visibleWhen: isTransform },
  { kind: 'slider', key: 'qa', label: 'a', min: -3, max: 3, step: 0.25, default: 1, tone: '--c-fn', visibleWhen: isQuadratic },
  { kind: 'slider', key: 'qb', label: 'b', min: -10, max: 10, step: 0.5, default: -2, tone: '--c-fn', visibleWhen: isQuadratic },
  { kind: 'slider', key: 'qc', label: 'c', min: -10, max: 10, step: 0.5, default: -3, tone: '--c-fn', visibleWhen: isQuadratic },
];

const T0 = { mode: 'transform', base: 'square', h: 0, v: 0, k: 1, m: 1, flipX: false, absOuter: false };

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Grafiği taşımak',
    body: `Kesikli çizgi temel fonksiyon $f(x) = x^2$, mavi çizgi dönüştürülmüş hâli:

$$g(x) = k\\cdot f\\big(m(x - h)\\big) + v$$

Kırmızı noktayı sürükle: **h** grafiği sağa-sola, **v** yukarı-aşağı taşır.`,
    scene: { patch: { ...T0, h: 2, v: 1 } },
    sceneLabel: '(x − 2)² + 1 göster',
  },
  {
    kind: 'predict-choice',
    title: 'Parantez içindeki işaret',
    question: '$g(x) = (x + 3)^2$ grafiği, $x^2$ grafiğine göre nereye kayar?',
    options: ['3 birim sağa', '3 birim sola', '3 birim yukarı', '3 birim aşağı'],
    correctIndex: 1,
    setup: T0,
    observe: { animate: { key: 'h', to: -3, durationMs: 1800 } },
    explain:
      '$x + 3 = x - (-3)$, yani $h = -3$: grafik **sola** kayar. Sezgiye ters gelir ama mantıklıdır: eski tepe noktasındaki değeri (0) almak için artık $x = -3$ gerekir.',
  },
  {
    kind: 'predict-choice',
    title: 'Negatif katsayı',
    question: '$g(x) = -2x^2$ grafiği $x^2$\'ye göre nasıldır?',
    options: ['Sola kaymış', 'x eksenine göre yansımış ve 2 kat dikleşmiş', 'y eksenine göre yansımış', 'İki kat genişlemiş'],
    correctIndex: 1,
    setup: T0,
    observe: { animate: { key: 'k', to: -2, durationMs: 1800 } },
    explain:
      'Fonksiyonun **dışındaki** katsayı y değerlerini çarpar: eksi işareti grafiği **x eksenine göre** ters çevirir, 2 ise her yüksekliği iki katına çıkarır. İçerideki katsayılar ($m$, $f(-x)$) ise x yönünde etki eder.',
  },
  {
    kind: 'explore',
    title: 'Parabol ve diskriminant',
    body: `$f(x) = ax^2 + bx + c$ parabolünün kökleri, grafiğin x eksenini kestiği yerlerdir.

**Diskriminant** $\\Delta = b^2 - 4ac$ kaç kök olduğunu söyler:
- $\\Delta > 0$: iki farklı kök
- $\\Delta = 0$: parabol x eksenine teğet
- $\\Delta < 0$: gerçek kök yok

Sarı tepe noktasını yukarı-aşağı sürükleyip Δ'nın işaretinin değişimini izle.`,
    scene: { patch: { mode: 'quadratic', qa: 1, qb: -2, qc: -3 } },
    sceneLabel: 'Parabol moduna geç',
  },
  {
    kind: 'predict-number',
    title: 'Köklerin toplamı',
    question: '$x^2 - 4x + 3 = 0$ denkleminin köklerinin **toplamı** kaçtır?',
    answer: 4,
    tolerance: 0.01,
    setup: { mode: 'quadratic', qa: 1, qb: -2, qc: -3 },
    observe: { patch: { qa: 1, qb: -4, qc: 3 } },
    explain:
      'Kökler 1 ve 3; toplamları **4**. Kısa yol (Vieta): $x_1 + x_2 = -\\dfrac{b}{a} = 4$, $x_1 x_2 = \\dfrac{c}{a} = 3$. Simetri ekseni de köklerin tam ortasında: $x = 2$.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'move-vertex',
    setup: T0,
    prompt: '$x^2$ grafiğinin tepe noktasını $(2, -3)$ noktasına taşı (genişliğini değiştirmeden).',
    check: (p) =>
      isTransform(p) && str(p, 'base') === 'square' && near(num(p, 'h'), 2, 1e-9) && near(num(p, 'v'), -3, 1e-9) && near(num(p, 'k'), 1, 1e-9) && !bool(p, 'absOuter'),
    hints: ['Kırmızı noktayı sürükle ya da h ve v kaydırıcılarını kullan.', '$g(x) = (x - 2)^2 - 3$'],
  },
  {
    id: 'roots-vertex',
    setup: { mode: 'quadratic', qa: 1, qb: -2, qc: -3 },
    prompt: 'Kökleri **1** ve **3**, tepe noktası **y = −2** olan parabolü kur.',
    check: (p) => {
      if (!isQuadratic(p)) return false;
      const q = quadraticOf(p);
      return q.roots.length === 2 && near(q.roots[0], 1, 1e-6) && near(q.roots[1], 3, 1e-6) && near(q.vertex[1], -2, 1e-6);
    },
    hints: ['Kökleri 1 ve 3 olan parabol: $a(x-1)(x-3)$.', 'Tepe noktası $x = 2$\'de: $a(1)(-1) = -2 \\Rightarrow a = 2$.'],
  },
  {
    id: 'tangent-axis',
    setup: { mode: 'quadratic', qa: 1, qb: -2, qc: -3 },
    prompt: 'x eksenine **teğet** olan ($\\Delta = 0$) bir parabol kur; ama $b \\ne 0$ olsun.',
    check: (p) => {
      if (!isQuadratic(p)) return false;
      const q = quadraticOf(p);
      return Math.abs(q.delta) < 1e-9 && !near(q.b, 0, 1e-9) && !near(q.a, 0, 1e-9);
    },
    hints: ['$b^2 = 4ac$ olmalı.', 'Tepe noktasını x ekseninin üzerine (y = 0) sürükle.'],
  },
];

export const transformModule: SimulationModule = {
  id: 'function-transforms',
  params,
  Component: TransformSimulation,
  lesson,
  challenges,
  formula: (p) => {
    if (isQuadratic(p)) {
      const q = quadraticOf(p);
      const rootsTex = q.roots.length === 2 ? `x_1 = ${tex(q.roots[0], 3)},\\ x_2 = ${tex(q.roots[1], 3)}` : q.roots.length === 1 ? `x = ${tex(q.roots[0], 3)}` : '\\text{gerçek kök yok}';
      return `\\begin{aligned}
f(x) &= ${quadraticTex(q)} \\\\[3pt]
\\Delta &= b^2 - 4ac = ${tex(q.delta, 3)} \\\\[3pt]
&${rootsTex}
\\end{aligned}`;
    }
    return `g(x) = ${transformTex(p.base, transformOf(p))}`;
  },
  readouts: (p) => {
    if (isQuadratic(p)) {
      const q = quadraticOf(p);
      return [
        { label: 'Diskriminant Δ', value: fmt(q.delta, 3), tone: '--c-hot' },
        { label: 'Kökler', value: q.roots.length ? q.roots.map((r) => fmt(r, 3)).join(' ; ') : 'yok', tone: '--c-hot' },
        { label: 'Tepe noktası', value: Number.isFinite(q.vertex[0]) ? `(${fmt(q.vertex[0], 2)}, ${fmt(q.vertex[1], 2)})` : '—', tone: '--c-pt' },
        { label: 'y-kesişimi', value: fmt(q.c, 2) },
        { label: 'Kollar', value: q.a > 0 ? 'yukarı ∪' : q.a < 0 ? 'aşağı ∩' : 'doğru' },
      ];
    }
    const t = transformOf(p);
    return [
      { label: 'Yatay kayma', value: t.h === 0 ? 'yok' : `${fmt(Math.abs(t.h))} ${t.h > 0 ? 'sağa' : 'sola'}`, tone: '--c-hot' },
      { label: 'Dikey kayma', value: t.v === 0 ? 'yok' : `${fmt(Math.abs(t.v))} ${t.v > 0 ? 'yukarı' : 'aşağı'}`, tone: '--c-hot' },
      { label: 'Dikey ölçek', value: `×${fmt(t.k)}${t.k < 0 ? ' (x eksenine göre yansıma)' : ''}`, tone: '--c-fn' },
      { label: 'Yatay ölçek', value: `×${fmt(1 / t.m, 2)} genişlik`, tone: '--c-fn' },
    ];
  },
};

export default transformModule;
