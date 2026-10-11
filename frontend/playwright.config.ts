import { defineConfig, devices } from '@playwright/test';

/**
 * Uçtan uca testler: gerçek tarayıcı + gerçek FastAPI backend'i.
 * Yerelde çalışan sunucular varsa yeniden kullanılır. PW_CHANNEL=msedge ile kurulu Edge kullanılabilir.
 */
const python = process.env.PYTHON ?? (process.platform === 'win32' ? '../backend/.venv/Scripts/python.exe' : 'python');

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: `${python} -m uvicorn app.main:app --app-dir ../backend --port 8000`,
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
