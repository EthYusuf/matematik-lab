import { expect, test, type Page } from '@playwright/test';
import { CATALOG } from '../src/simulations/catalog';

/** Sayfa hatalarını toplar; test sonunda boş olmalı. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Kaydırıcıyı React'in fark edeceği şekilde ayarlar. */
async function setSlider(page: Page, label: string, value: number) {
  await page.getByLabel(label, { exact: true }).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-init', '1');
    }
  });
});

test('ana sayfa 20 konuyu ve hepsinin hazır olduğunu gösterir', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('dokunarak');
  await expect(page.locator('#konular li')).toHaveCount(20);
  await expect(page.locator('#konular a[href^="/konu/"]')).toHaveCount(20);
  expect(errors).toEqual([]);
});

for (const topic of CATALOG) {
  test(`simülasyon açılır: ${topic.title}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/konu/${topic.id}`);
    await expect(page.getByRole('heading', { level: 1, name: topic.title })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Simülasyon' }).locator('svg, canvas').first()).toBeVisible();
    await expect(page.getByText('Canlı formül')).toBeVisible();
    await expect(page.locator('.katex').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Görevler' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('tahmin et → gözlemle akışı', async ({ page }) => {
  await page.goto('/konu/trig-unit-circle');
  await page.getByRole('button', { name: /Anladım, devam/ }).click();
  await expect(page.getByRole('heading', { name: 'Tepe noktasında' })).toBeVisible();
  await page.getByRole('radio').first().click(); // "0" — bilerek yanlış
  await page.getByRole('button', { name: /Tahminimi kilitle/ }).click();
  await expect(page.getByText('Beklenmedik bir sonuç!')).toBeVisible();
  await expect(page.getByText(/90°'de P çemberin en tepesindedir/)).toBeVisible();
});

test('görev otomatik doğrulanır ve ilerleme kaydedilir', async ({ page }) => {
  await page.goto('/konu/trig-unit-circle');
  const card = page.locator('#gorevler li').first();
  await card.getByRole('button', { name: 'Göreve başla' }).click();
  await setSlider(page, 'Genlik A', 2);
  await setSlider(page, 'Frekans B', 2);
  await expect(card.getByLabel('Çözüldü')).toBeVisible();
  await expect(page.getByText('1/3 çözüldü')).toBeVisible();
  await page.goto('/');
  await expect(page.locator('#konular a[href="/konu/trig-unit-circle"]')).toContainText('%20');
});

test('adım adım türev çözümü (Python / SymPy)', async ({ page }) => {
  await page.goto('/konu/derivative-tangent');
  await page.getByRole('button', { name: 'Çöz' }).click();
  await expect(page.getByText('Çarpım kuralı')).toBeVisible();
  await expect(page.getByText('✓ SymPy ile doğrulandı')).toBeVisible();
});

test('kötü niyetli ifade reddedilir', async ({ page }) => {
  await page.goto('/konu/limit-epsilon-delta');
  const input = page.getByRole('region', { name: 'Adım adım çözüm' }).locator('input').first();
  await input.fill("__import__('os')");
  await page.getByRole('button', { name: 'Çöz' }).click();
  await expect(page.getByText(/İzin verilmeyen karakter/)).toBeVisible();
});

test('pekiştirme sorusu sunucuda kontrol edilir', async ({ page }) => {
  await page.goto('/konu/vectors');
  const quiz = page.getByRole('region', { name: 'Pekiştirme sorusu' });
  await expect(quiz.getByRole('button', { name: 'Kontrol et' })).toBeVisible();
  const choices = quiz.getByRole('radio');
  if (await choices.count()) await choices.first().click();
  else await quiz.getByLabel('Cevabın').fill('12345');
  await quiz.getByRole('button', { name: 'Kontrol et' }).click();
  await expect(quiz.getByText(/Doğru!|Bu sefer olmadı/)).toBeVisible();
  await expect(quiz.getByRole('button', { name: /Yeni soru/ })).toBeVisible();
});

test('hesap: kayıt → panel → tekrar → çıkış', async ({ page }) => {
  const name = `e2e${Date.now().toString(36)}`;
  await page.goto('/kayit');
  await page.getByLabel('Kullanıcı adı').fill(name);
  await page.getByLabel('Parola').fill('e2e-guclu-parola');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
  await expect(page.getByRole('heading', { name: 'Ustalık haritası' })).toBeVisible();

  // Oturum sayfa yenilemesinden sonra çerezle geri gelir
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);

  await page.goto('/tekrar');
  await expect(page.getByRole('heading', { name: 'Tekrar zamanı' })).toBeVisible();

  await page.getByRole('button', { name: 'Çıkış' }).click();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Giriş yap' })).toBeVisible();
});

test('koyu tema seçimi kalıcıdır', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kara tahta temasına geç' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Python Lab açılır', async ({ page }) => {
  await page.goto('/python-lab');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Python');
  await expect(page.getByRole('textbox', { name: 'Python kodu' })).toHaveValue(/pi_tahmini/);
});

test('Python Lab tarayıcıda gerçek Python çalıştırır (Pyodide)', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/python-lab?ornek=newton');
  await expect(page.getByText(/Hazır · Python/)).toBeVisible({ timeout: 120_000 });
  await page.getByRole('button', { name: '▶ Çalıştır' }).click();
  const output = page.getByRole('region', { name: 'Çıktı' });
  await expect(output).toContainText('x4 = 1.414213562374690', { timeout: 30_000 });
  await expect(output).toContainText('Gerçek √2');
});

test('bilinmeyen sayfa', async ({ page }) => {
  await page.goto('/olmayan-sayfa');
  await expect(page.getByRole('heading', { name: 'Tanımsız' })).toBeVisible();
});
