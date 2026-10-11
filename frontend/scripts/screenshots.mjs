// README ekran görüntülerini üretir: npm run screenshots  (backend ve frontend çalışır olmalı)
// Çıktı: ../docs/screenshots/*.png
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const OUT = new URL('../../docs/screenshots/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173';

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' });

async function open(path, { theme = 'light', width = 1440, height = 900, scale = 1, waitUntil = 'networkidle' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await context.newPage();
  await page.addInitScript((t) => {
    if (!sessionStorage.getItem('shot-init')) {
      localStorage.clear();
      sessionStorage.setItem('shot-init', '1');
    }
    localStorage.setItem('matematik-lab-theme', t);
  }, theme);
  await page.goto(BASE + path, { waitUntil });
  await page.waitForTimeout(500);
  return { page, context };
}

async function slider(page, label, value) {
  await page.getByLabel(label, { exact: true }).evaluate((el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function save(page, name, locator) {
  const file = fileURLToPath(new URL(name, OUT));
  if (locator) await locator.screenshot({ path: file });
  else await page.screenshot({ path: file });
  console.log('✓', name);
}

async function scrollTo(page, selector, offset = 72) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off });
    },
    [selector, offset],
  );
  await page.waitForTimeout(300);
}

// 1–2) Ana sayfa: açık ve koyu tema
for (const theme of ['light', 'dark']) {
  const { page, context } = await open('/', { theme });
  await page.waitForTimeout(1200);
  await save(page, `home-${theme}.png`);
  if (theme === 'light') {
    await scrollTo(page, '#konular', 64);
    await save(page, 'catalog.png');
  }
  await context.close();
}

// 3) Tahmin et → gözlemle
{
  const { page, context } = await open('/konu/trig-unit-circle');
  await page.getByRole('button', { name: /Anladım, devam/ }).click();
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: /Tahminimi kilitle/ }).click();
  await page.waitForTimeout(2200);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'lesson-predict.png');
  await context.close();
}

// 4) Türev: teğet + türev grafiği
{
  const { page, context } = await open('/konu/derivative-tangent');
  await page.getByRole('button', { name: /Anladım, devam/ }).click();
  await page.getByRole('button', { name: /Sonraki adım|Tahminimi/ }).first().waitFor();
  await page.getByRole('switch', { name: 'Teğet doğrusu' }).click();
  await page.getByRole('switch', { name: 'Türev grafiği f′(x)' }).click();
  await page.getByRole('button', { name: 'x³ − 3x' }).click();
  await slider(page, 'Nokta x₀', -1.6);
  await slider(page, 'Aralık h', 700);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'derivative.png');
  await context.close();
}

// 5) Çok değişkenli: 3B yüzey + gradient descent (koyu tema)
{
  const { page, context } = await open('/konu/multivariable-calculus', { theme: 'dark' });
  await page.getByRole('button', { name: 'Himmelblau', exact: true }).click();
  await slider(page, 'Öğrenme oranı η', 640);
  await slider(page, 'Adım sayısı', 40);
  await slider(page, 'Döndür (azimut)', 220);
  await slider(page, 'Eğim (yükseklik)', 38);
  await page.waitForTimeout(400);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'multivariable-dark.png');
  await context.close();
}

// 6) Fourier: dönen çemberler
{
  const { page, context } = await open('/konu/fourier-series');
  await slider(page, 'Harmonik sayısı N', 9);
  await slider(page, 'Zaman t', 2.4);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'fourier.png');
  await context.close();
}

// 7) Galton tahtası
{
  const { page, context } = await open('/konu/probability-monte-carlo');
  await page.getByRole('button', { name: 'Galton tahtası', exact: true }).click();
  await slider(page, 'Deneme sayısı', 860);
  await page.waitForTimeout(400);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'galton.png');
  await context.close();
}

// 8) Graf teorisi: Dijkstra
{
  const { page, context } = await open('/konu/graph-theory', { theme: 'dark' });
  await page.getByRole('button', { name: 'Dijkstra', exact: true }).click();
  await slider(page, 'Adım', 6);
  await page.waitForTimeout(300);
  await scrollTo(page, '.workspace', 84);
  await save(page, 'graph-dark.png');
  await context.close();
}

// 9) Adım adım çözüm (Python / SymPy) ve 10) görev damgası
{
  const { page, context } = await open('/konu/derivative-tangent');
  const solver = page.getByRole('region', { name: 'Adım adım çözüm' });
  await solver.getByRole('button', { name: '(x^2+1)/(x-3)' }).click();
  await page.getByText('✓ SymPy ile doğrulandı').waitFor();
  await page.waitForTimeout(400);
  await solver.scrollIntoViewIfNeeded();
  await save(page, 'solver.png', solver);
  await context.close();
}
{
  const { page, context } = await open('/konu/trig-unit-circle');
  const card = page.locator('#gorevler li').first();
  await card.getByRole('button', { name: 'Göreve başla' }).click();
  await card.getByRole('button', { name: /İpucu/ }).click();
  await slider(page, 'Genlik A', 2);
  await slider(page, 'Frekans B', 2);
  await page.waitForTimeout(900);
  await save(page, 'challenge.png', page.locator('#gorevler'));
  await context.close();
}

// 11) Panel: kayıt + biraz ilerleme
{
  const { page, context } = await open('/kayit');
  const name = `elif${Date.now().toString(36).slice(-4)}`;
  await page.getByLabel('Kullanıcı adı').fill(name);
  await page.getByLabel('Görünen ad (isteğe bağlı)').fill('Elif');
  await page.getByLabel('Parola').fill('ekran-goruntusu-123');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await page.waitForURL(/panel/);
  // Örnek ilerleme: birkaç konuda ders ve görev
  await page.evaluate(async () => {
    const sims = {
      'derivative-tangent': [5, 3, 5, 3],
      'trig-unit-circle': [5, 2, 5, 3],
      'riemann-integral': [4, 1, 5, 3],
      'function-transforms': [3, 0, 5, 3],
      'probability-monte-carlo': [5, 3, 5, 3],
      'limit-epsilon-delta': [2, 1, 5, 3],
      vectors: [5, 2, 5, 3],
      'complex-numbers': [3, 1, 5, 3],
      'linear-transformations': [1, 0, 5, 3],
      'fourier-series': [2, 1, 5, 3],
    };
    const body = Object.fromEntries(
      Object.entries(sims).map(([id, [steps, solved, total, totalC]]) => [
        id,
        {
          completed_steps: Array.from({ length: steps }, (_, i) => i),
          predictions: Object.fromEntries(Array.from({ length: steps }, (_, i) => [String(i), i % 3 !== 1])),
          solved_challenges: ['a', 'b', 'c'].slice(0, solved),
          totals: { steps: total, challenges: totalC },
        },
      ]),
    );
    const token = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then((r) => r.json());
    await fetch('/api/progress/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.access_token}` },
      body: JSON.stringify({ sims: body }),
    });
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await save(page, 'dashboard.png');
  await context.close();
}

// 12) Python Lab: gerçek Python çalıştır (Pyodide CDN'den yüklenir)
{
  const { page, context } = await open('/python-lab', { waitUntil: 'load' });
  try {
    await page.getByText(/Hazır · Python/).waitFor({ timeout: 90_000 });
    await page.getByRole('button', { name: '▶ Çalıştır' }).click();
    await page.locator('img[alt="Grafik 1"]').waitFor({ timeout: 60_000 });
    await page.waitForTimeout(500);
    await save(page, 'python-lab.png');
  } catch (e) {
    console.warn('Python Lab görüntüsü alınamadı:', e.message);
  }
  await context.close();
}

// 13) Mobil
{
  const { page, context } = await open('/konu/trig-unit-circle', { width: 390, height: 844, scale: 2 });
  await scrollTo(page, '.workspace', 70);
  await save(page, 'mobile.png');
  await context.close();
}

await browser.close();
