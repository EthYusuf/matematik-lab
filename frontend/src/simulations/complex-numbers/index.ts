import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { cabs, cadd, carg, cmul, cpow, cstr, deg, zOf, type Cx } from './model';
import { ComplexSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'op',
    label: 'İşlem',
    default: 'mul',
    options: [
      { value: 'add', label: 'Toplama' },
      { value: 'mul', label: 'Çarpma' },
      { value: 'pow', label: 'Kuvvet zⁿ' },
      { value: 'roots', label: 'n. kökler' },
    ],
  },
  { kind: 'slider', key: 'n', label: 'n', min: 2, max: 8, step: 1, default: 4, visibleWhen: (p) => ['pow', 'roots'].includes(str(p, 'op')), format: (v) => String(Math.round(v)) },
  { kind: 'value', key: 'ar', default: 2 },
  { kind: 'value', key: 'ai', default: 1 },
  { kind: 'value', key: 'br', default: 0 },
  { kind: 'value', key: 'bi', default: 1 },
];

const ctex = (z: Cx) => cstr(z).replace('−', '-').replace(/,/g, '{,}');

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Sayıların düzlemi',
    body: `Karmaşık sayı $z = a + bi$, düzlemde bir noktadır: yatay eksen **gerçek**, dikey eksen **sanal** kısım (Argand düzlemi).

Her $z$'nin bir **uzunluğu** $|z| = \\sqrt{a^2 + b^2}$ ve bir **açısı** $\\arg z$ vardır: $z = |z|(\\cos\\theta + i\\sin\\theta)$.`,
    scene: { patch: { op: 'add', ar: 2, ai: 1, br: 0.5, bi: 2 } },
    sceneLabel: 'Toplamayı göster',
  },
  {
    kind: 'predict-choice',
    title: 'i ile çarpmak',
    question: 'Bir $z$ sayısını $i$ ile çarpmak düzlemde ne yapar?',
    options: ['Uzunluğunu iki katına çıkarır', '90° saat yönünün tersine döndürür', 'x eksenine göre yansıtır', 'Hiçbir şey'],
    correctIndex: 1,
    setup: { op: 'mul', ar: 2, ai: 1, br: 1, bi: 0 },
    observe: { patch: { br: 0, bi: 1 } },
    explain: '$i$\'nin uzunluğu 1, açısı 90°. Çarpınca uzunluk değişmez, açılar toplanır: **90° dönme**. Bu yüzden $i^2 = -1$: iki kez 90° dönen 1, $-1$ olur!',
  },
  {
    kind: 'predict-number',
    title: 'Modül',
    question: '$|3 + 4i|$ kaçtır?',
    answer: 5,
    tolerance: 0.01,
    setup: { op: 'add', br: 0, bi: 0 },
    observe: { patch: { ar: 3, ai: 4 } },
    explain: '$|3 + 4i| = \\sqrt{3^2 + 4^2} = 5$ — orijinden noktaya olan uzaklık.',
  },
  {
    kind: 'predict-choice',
    title: '(1 + i)²',
    question: '$(1 + i)^2$ neye eşittir?',
    options: ['$2$', '$2i$', '$1 + i$', '$0$'],
    correctIndex: 1,
    setup: { op: 'pow', n: 2, ar: 0.5, ai: 0.5 },
    observe: { patch: { ar: 1, ai: 1 } },
    explain: '$1 + i$\'nin uzunluğu $\\sqrt2$, açısı 45°. Karesi: uzunluk $(\\sqrt2)^2 = 2$, açı $90°$ → $2i$. Cebirle: $1 + 2i + i^2 = 2i$. **De Moivre**: $z^n$ için uzunluk $n$. kuvvet, açı $n$ katı.',
  },
  {
    kind: 'explore',
    title: 'Birimin kökleri',
    body: `$z^n = w$ denkleminin her zaman tam **n** karmaşık kökü vardır. Hepsi aynı çember üzerindedir ve **düzgün bir n-gen** oluşturur:

$$z_k = \\sqrt[n]{|w|}\\left(\\cos\\frac{\\theta + 2\\pi k}{n} + i\\sin\\frac{\\theta + 2\\pi k}{n}\\right)$$

n'yi değiştir ve z₁'i sürükle.`,
    scene: { patch: { op: 'roots', n: 6, ar: 1, ai: 0 } },
    sceneLabel: 'z⁶ = 1 köklerini göster',
  },
];

const challenges: Challenge[] = [
  {
    id: 'product-neg4',
    setup: { op: 'mul', ar: 2, ai: 1, br: 0, bi: 1 },
    prompt: 'Çarpma modunda $z_1 \\cdot z_2 = -4$ olsun (gerçek eksenin negatif tarafı), ama ikisi de gerçek sayı olmasın.',
    check: (p) => {
      const { z1, z2 } = zOf(p);
      const r = cmul(z1, z2);
      return str(p, 'op') === 'mul' && near(r[0], -4, 1e-9) && near(r[1], 0, 1e-9) && Math.abs(z1[1]) > 1e-9 && Math.abs(z2[1]) > 1e-9;
    },
    hints: ['Açılar toplamı 180° olmalı, uzunluklar çarpımı 4.', '$2i \\cdot 2i = -4$'],
  },
  {
    id: 'fourth-power',
    setup: { op: 'pow', n: 4, ar: 2, ai: 1 },
    prompt: 'Kuvvet modunda $n = 4$ iken $z_1^4 = -4$ olacak bir $z_1$ bul.',
    check: (p) => {
      const { z1 } = zOf(p);
      const w = cpow(z1, 4);
      return str(p, 'op') === 'pow' && Math.round(num(p, 'n')) === 4 && near(w[0], -4, 1e-6) && near(w[1], 0, 1e-6);
    },
    hints: ['$|z|^4 = 4 \\Rightarrow |z| = \\sqrt2$.', '$4\\theta = 180° \\Rightarrow \\theta = 45°$: $z = 1 + i$.'],
  },
  {
    id: 'product-polar',
    setup: { op: 'mul', ar: 2, ai: 1, br: 0, bi: 1 },
    prompt: 'Çarpımın **modülü 6**, **argümanı 90°** olsun.',
    check: (p) => {
      const { z1, z2 } = zOf(p);
      const r = cmul(z1, z2);
      return str(p, 'op') === 'mul' && near(cabs(r), 6, 1e-6) && near(r[0], 0, 1e-6) && r[1] > 0;
    },
    hints: ['Çarpım $6i$ olmalı.', 'Örneğin $z_1 = 3$, $z_2 = 2i$ — ya da daha ilginç bir çift: $(1+i)(3+3i)$.'],
  },
];

export const complexModule: SimulationModule = {
  id: 'complex-numbers',
  params,
  Component: ComplexSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { z1, z2 } = zOf(p);
    const op = str(p, 'op');
    const n = Math.round(num(p, 'n'));
    const polar = `z_1 = ${ctex(z1)} = ${tex(cabs(z1))}\\,\\angle\\,${tex(deg(carg(z1)), 1)}^\\circ`;
    const line =
      op === 'add'
        ? `z_1 + z_2 = ${ctex(cadd(z1, z2))}`
        : op === 'mul'
          ? `z_1 z_2 = ${ctex(cmul(z1, z2))} = ${tex(cabs(cmul(z1, z2)))}\\,\\angle\\,${tex(deg(carg(cmul(z1, z2))), 1)}^\\circ`
          : op === 'pow'
            ? `z_1^{${n}} = ${ctex(cpow(z1, n))}`
            : `z^{${n}} = z_1 \\Rightarrow |z| = ${tex(cabs(z1) ** (1 / n), 3)}`;
    return `\\begin{aligned}&${polar}\\\\[3pt]&${line}\\end{aligned}`;
  },
  readouts: (p) => {
    const { z1, z2 } = zOf(p);
    return [
      { label: 'z₁', value: cstr(z1), tone: '--c-hot' },
      { label: '|z₁| , arg z₁', value: `${fmt(cabs(z1), 3)} , ${fmt(deg(carg(z1)), 1)}°`, tone: '--c-hot' },
      { label: 'z₂', value: cstr(z2), tone: '--c-fn' },
      { label: 'z₁ · z₂', value: cstr(cmul(z1, z2)), tone: '--c-tan' },
    ];
  },
};

export default complexModule;
