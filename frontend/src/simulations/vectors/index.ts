import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { add, angle, cross, dot, norm, vecsOf } from './model';
import { VectorSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'mode',
    label: 'İşlem',
    default: 'add',
    options: [
      { value: 'add', label: 'Toplama' },
      { value: 'dot', label: 'Skaler çarpım' },
      { value: 'cross', label: 'Vektörel çarpım' },
    ],
  },
  { kind: 'value', key: 'ux', default: 3 },
  { kind: 'value', key: 'uy', default: 1 },
  { kind: 'value', key: 'vx', default: 1 },
  { kind: 'value', key: 'vy', default: 2.5 },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Vektör toplama',
    body: `Vektör, bir **yön ve uzunluk** taşıyan oktur. Toplamak için ikinci okun kuyruğunu birincinin ucuna koy:

$$\\vec u + \\vec v = (u_1 + v_1,\\ u_2 + v_2)$$

Kırmızı ve mavi uçları sürükle. Yeşil toplam, iki vektörün oluşturduğu paralelkenarın köşegenidir.`,
    scene: { patch: { mode: 'add', ux: 3, uy: 1, vx: 1, vy: 2.5 } },
    sceneLabel: 'Toplamayı göster',
  },
  {
    kind: 'predict-number',
    title: 'Uzunluk',
    question: '$\\vec u = (3, 4)$ vektörünün uzunluğu $|\\vec u|$ kaçtır?',
    answer: 5,
    tolerance: 0.01,
    setup: { mode: 'add' },
    observe: { patch: { ux: 3, uy: 4 } },
    explain: 'Pisagor: $|\\vec u| = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$. Bu, okun x ve y bileşenlerinin oluşturduğu dik üçgenin hipotenüsüdür.',
  },
  {
    kind: 'explore',
    title: 'Skaler çarpım = izdüşüm',
    body: `$\\vec u \\cdot \\vec v = u_1 v_1 + u_2 v_2 = |\\vec u|\\,|\\vec v| \\cos\\theta$

Geometrik anlamı: $\\vec v$'nin $\\vec u$ doğrultusundaki **gölgesi** (yeşil izdüşüm) çarpı $|\\vec u|$. Aynı yöne bakıyorlarsa pozitif, zıt yöne bakıyorlarsa negatif.`,
    scene: { patch: { mode: 'dot', ux: 4, uy: 0.5, vx: 2, vy: 3 } },
    sceneLabel: 'İzdüşümü göster',
  },
  {
    kind: 'predict-choice',
    title: 'Dik vektörler',
    question: '$\\vec u$ ile $\\vec v$ birbirine **dik** ise $\\vec u \\cdot \\vec v$ kaçtır?',
    options: ['$|\\vec u|\\,|\\vec v|$', '1', '0', '−1'],
    correctIndex: 2,
    setup: { mode: 'dot', ux: 4, uy: 0, vx: 2, vy: 3 },
    observe: { patch: { vx: 0, vy: 3 } },
    explain: '$\\cos 90° = 0$: dik vektörün diğerinin üzerine gölgesi yoktur. Bu yüzden **skaler çarpım 0 ⇔ diklik**, geometride en çok kullanılan testlerden biridir.',
  },
  {
    kind: 'predict-choice',
    title: 'Vektörel çarpım',
    question: '$\\vec u$ ile $\\vec v$ **aynı doğrultudaysa** vektörel çarpımın büyüklüğü $|\\vec u \\times \\vec v|$ ne olur?',
    options: ['En büyük değerini alır', '0 olur', '$|\\vec u| + |\\vec v|$ olur', 'Tanımsızdır'],
    correctIndex: 1,
    setup: { mode: 'cross', ux: 3, uy: 1, vx: 1, vy: 2.5 },
    observe: { patch: { vx: 1.5, vy: 0.5 } },
    explain: '$|\\vec u \\times \\vec v| = |\\vec u|\\,|\\vec v|\\sin\\theta$ — **paralelkenarın alanı**. Aynı doğrultuda $\\theta = 0$, paralelkenar ezilir ve alan 0 olur. Dik olduklarında ise en büyüktür.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'sum-target',
    setup: { mode: 'add', ux: 3, uy: 1, vx: 1, vy: 2.5 },
    prompt: '$\\vec u + \\vec v = (4,\\ -1)$ olsun; ama ikisi de x eksenine paralel olmasın.',
    check: (p) => {
      const { u, v } = vecsOf(p);
      const s = add(u, v);
      return str(p, 'mode') === 'add' && near(s[0], 4, 1e-9) && near(s[1], -1, 1e-9) && Math.abs(u[1]) > 1e-9 && Math.abs(v[1]) > 1e-9;
    },
    hints: ['Toplamın bileşenleri ayrı ayrı toplanır.', 'Örneğin $\\vec u = (2, 1)$, $\\vec v = (2, -2)$.'],
  },
  {
    id: 'perpendicular',
    setup: { mode: 'dot', ux: 3, uy: 1, vx: 1, vy: 2.5 },
    prompt: 'İkisi de sıfırdan farklı olmak üzere $\\vec u \\cdot \\vec v = 0$ yap — ama hiçbiri eksenlere paralel olmasın.',
    check: (p) => {
      const { u, v } = vecsOf(p);
      return near(dot(u, v), 0, 1e-9) && u.every((c) => Math.abs(c) > 1e-9) && v.every((c) => Math.abs(c) > 1e-9);
    },
    hints: ['$(a, b)$ vektörüne dik olan $(-b, a)$\'dır.', '$\\vec u = (3, 1)$ için $\\vec v = (-1, 3)$ dene.'],
  },
  {
    id: 'area-six',
    setup: { mode: 'cross', ux: 3, uy: 1, vx: 1, vy: 2.5 },
    prompt: '$\\vec u$ ve $\\vec v$\'nin oluşturduğu paralelkenarın alanı tam **6** olsun ve yön **sayfanın içine** (⊗) baksın.',
    check: (p) => {
      const { u, v } = vecsOf(p);
      return near(cross(u, v), -6, 1e-9);
    },
    hints: ['$u_1 v_2 - u_2 v_1 = -6$ olmalı.', '$\\vec v$\'yi $\\vec u$\'nun saat yönündeki tarafına al.'],
  },
];

export const vectorModule: SimulationModule = {
  id: 'vectors',
  params,
  Component: VectorSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { u, v } = vecsOf(p);
    const mode = str(p, 'mode');
    const head = `\\vec u = (${tex(u[0])}, ${tex(u[1])}),\\ \\vec v = (${tex(v[0])}, ${tex(v[1])})`;
    if (mode === 'dot') return `\\begin{aligned}&${head}\\\\[3pt]&\\vec u\\cdot\\vec v = ${tex(u[0])}\\cdot${tex(v[0])} + ${tex(u[1])}\\cdot${tex(v[1])} = ${tex(dot(u, v))}\\end{aligned}`;
    if (mode === 'cross') return `\\begin{aligned}&${head}\\\\[3pt]&\\vec u\\times\\vec v = u_1v_2 - u_2v_1 = ${tex(cross(u, v))}\\end{aligned}`;
    const s = add(u, v);
    return `\\begin{aligned}&${head}\\\\[3pt]&\\vec u + \\vec v = (${tex(s[0])}, ${tex(s[1])})\\end{aligned}`;
  },
  readouts: (p) => {
    const { u, v } = vecsOf(p);
    return [
      { label: '|u|', value: fmt(norm(u), 3), tone: '--c-hot' },
      { label: '|v|', value: fmt(norm(v), 3), tone: '--c-fn' },
      { label: 'u · v', value: fmt(dot(u, v), 3), tone: '--c-tan' },
      { label: 'Açı θ', value: `${fmt((angle(u, v) * 180) / Math.PI, 1)}°`, tone: '--c-pt' },
      { label: 'u × v (z)', value: fmt(cross(u, v), 3) },
    ];
  },
};

export default vectorModule;
