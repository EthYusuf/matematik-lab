import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import type { Challenge, LessonStep, ParamSchema, SimulationModule } from '../../core/types';
import { det, eigen, matrixOf, trace } from './model';
import { LinearSimulation } from './Simulation';

const entry = (key: string, label: string, def: number, tone: string): ParamSchema => ({
  kind: 'slider',
  key,
  label,
  min: -3,
  max: 3,
  step: 0.25,
  default: def,
  tone,
});

const params: ParamSchema[] = [
  entry('a', 'a (î′ yatay)', 1.5, '--c-hot'),
  entry('c', 'c (î′ dikey)', 0.5, '--c-hot'),
  entry('b', 'b (ĵ′ yatay)', 0.5, '--c-tan'),
  entry('d', 'd (ĵ′ dikey)', 1, '--c-tan'),
  { kind: 'toggle', key: 'showGrid', label: 'Dönüşmüş ızgara', default: true },
  { kind: 'toggle', key: 'showEigen', label: 'Özvektör doğruları', default: false },
  { kind: 'value', key: 'vx', default: 1 },
  { kind: 'value', key: 'vy', default: 2 },
];

const I = { a: 1, b: 0, c: 0, d: 1 };

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Matris = yeni eksenler',
    body: `Bir $2\\times2$ matris düzlemi **büker**. Ne yaptığını anlamak için yalnızca iki şeye bakmak yeter: $\\hat\\imath = (1,0)$ ve $\\hat\\jmath = (0,1)$ nereye gidiyor?

$$A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\Rightarrow \\hat\\imath' = \\begin{pmatrix} a \\\\ c\\end{pmatrix},\\ \\hat\\jmath' = \\begin{pmatrix} b \\\\ d\\end{pmatrix}$$

Kırmızı ve yeşil uçları sürükle: tüm ızgara onlarla birlikte bükülür.`,
    scene: { patch: { a: 1.5, b: 0.5, c: 0.5, d: 1, showGrid: true, showEigen: false } },
    sceneLabel: 'Örnek matrisi kur',
  },
  {
    kind: 'predict-number',
    title: 'Alan ne olur?',
    question: '$A = \\begin{pmatrix} 2 & 0 \\\\ 0 & 3 \\end{pmatrix}$ birim kareyi kaç birim karelik bir alana dönüştürür?',
    answer: 6,
    tolerance: 0.01,
    setup: { ...I, showEigen: false },
    observe: { patch: { a: 2, d: 3 } },
    explain: 'Kare 2 kat genişleyip 3 kat uzadı: alan **6**. Genel olarak alan çarpanı $|\\det A| = |ad - bc|$\'dir.',
  },
  {
    kind: 'predict-choice',
    title: 'Negatif determinant',
    question: '$\\det A$ negatif olursa ne olur?',
    options: ['Alan negatif olur', 'Düzlem ters yüz edilir (ayna görüntüsü)', 'Hiçbir şey değişmez', 'Düzlem bir noktaya çöker'],
    correctIndex: 1,
    setup: { ...I, showEigen: false },
    observe: { animate: { key: 'd', to: -1, durationMs: 2000 } },
    explain:
      'ĵ′ aşağı döndü: î′\'dan ĵ′\'ya dönüş yönü saat yönüne çevrildi. Alan yine $|\\det A|$, ama **yönelim** tersine döndü (paralelkenar kırmızı). Ayna görüntüsü gibi.',
  },
  {
    kind: 'explore',
    title: 'Özvektörler',
    body: `Çoğu vektör dönüşümde yön değiştirir. Ama bazı özel yönler sadece **uzar ya da kısalır**: bunlar **özvektörlerdir**.

$$A\\vec v = \\lambda \\vec v$$

Sarı kesikli çizgiler özvektör doğruları, $\\lambda$ ise ölçek çarpanı. Gri $\\vec v$ vektörünü bu doğrulardan birinin üzerine sürükle: $A\\vec v$ aynı doğruda kalır.`,
    scene: { patch: { a: 2, b: 1, c: 1, d: 2, showEigen: true, vx: 1, vy: 1 } },
    sceneLabel: 'Simetrik matrisle göster',
  },
  {
    kind: 'predict-choice',
    title: 'Tekil matris',
    question: '$\\det A = 0$ olan bir matris düzlemi neye dönüştürür?',
    options: ['Daha büyük bir düzleme', 'Bir doğruya (ya da tek noktaya)', 'Bir çembere', 'Kendisine'],
    correctIndex: 1,
    setup: { a: 1.5, b: 0.5, c: 0.5, d: 1, showEigen: false },
    observe: { patch: { a: 1, b: 2, c: 0.5, d: 1 } },
    explain:
      'î′ ve ĵ′ aynı doğru üzerine düştü: tüm ızgara o doğruya **çöktü**, alan 0. Bu yüzden tekil matrisin tersi yoktur — çöken boyut geri getirilemez.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'rotate-90',
    setup: { ...I },
    prompt: 'Düzlemi saat yönünün **tersine 90°** döndüren matrisi kur.',
    check: (p) => {
      const m = matrixOf(p);
      return near(m.a, 0, 1e-9) && near(m.b, -1, 1e-9) && near(m.c, 1, 1e-9) && near(m.d, 0, 1e-9);
    },
    hints: ['90° dönünce î = (1, 0) nereye gider?', 'î′ = (0, 1), ĵ′ = (−1, 0).'],
  },
  {
    id: 'flip-triple',
    setup: { ...I },
    prompt: 'Alanı **3 katına** çıkaran ama **yönelimi ters çeviren** bir matris kur.',
    check: (p) => near(det(matrixOf(p)), -3, 1e-9),
    hints: ['$\\det A = -3$ olmalı.', 'Örneğin bir ekseni $-1$, diğerini 3 ile çarp.'],
  },
  {
    id: 'eigen-two',
    setup: { ...I, showEigen: true },
    prompt: 'Özdeğerlerinden biri **2** olan ve **köşegen olmayan** ($b \\ne 0$ veya $c \\ne 0$) bir matris kur.',
    check: (p) => {
      const m = matrixOf(p);
      const e = eigen(m);
      return (Math.abs(m.b) > 1e-9 || Math.abs(m.c) > 1e-9) && e.real && e.values.some((l) => near(l, 2, 0.01));
    },
    hints: ['Üçgen matrislerin özdeğerleri köşegendekilerdir.', 'Örneğin $a = 2$, $b = 1$, $c = 0$ dene.'],
  },
];

export const linearModule: SimulationModule = {
  id: 'linear-transformations',
  params,
  Component: LinearSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const m = matrixOf(p);
    return `\\begin{aligned}&A = \\begin{pmatrix} ${tex(m.a)} & ${tex(m.b)} \\\\ ${tex(m.c)} & ${tex(m.d)} \\end{pmatrix} \\\\[4pt] &\\det A = ad - bc = ${tex(det(m), 3)}\\end{aligned}`;
  },
  readouts: (p) => {
    const m = matrixOf(p);
    const D = det(m);
    const e = eigen(m);
    return [
      { label: 'det A', value: fmt(D, 3), tone: D < 0 ? '--c-hot' : '--c-pt' },
      { label: 'İz (a + d)', value: fmt(trace(m), 3) },
      {
        label: 'Özdeğerler',
        value: e.real ? e.values.map((v) => fmt(v, 3)).join(' ; ') : `${fmt(e.complex!.re, 2)} ± ${fmt(e.complex!.im, 2)}i`,
        tone: '--c-pt',
      },
      { label: 'Yönelim', value: D > 0 ? 'korunur' : D < 0 ? 'ters' : 'çöker' },
    ];
  },
};

export default linearModule;
