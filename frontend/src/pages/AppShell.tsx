import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useApiHealth } from '../features/api/useApiHealth';
import { useAuth } from '../features/auth/store';
import { useProgress } from '../features/progress/store';
import { useProgressSync } from '../features/progress/sync';
import { useTheme } from '../features/theme/useTheme';
import { Toaster } from '../features/toast/store';

export function AppShell({ children }: { children: ReactNode }) {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  useProgressSync();

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#icerik" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">
        İçeriğe geç
      </a>
      <Header />
      <main id="icerik" className="flex-1">
        {children}
      </main>
      <footer className="mt-24 border-t border-rule">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-ink-3 md:px-8">
          <p>
            <span className="font-display text-[15px] text-ink-2">Matematik Lab</span> · 20 etkileşimli simülasyon · React + Python
          </p>
          <nav className="flex gap-4">
            <Link to="/python-lab" className="hover:text-ink">
              Python Lab
            </Link>
            <Link to="/kvkk" className="hover:text-ink">
              KVKK
            </Link>
            <a href="/api/docs" className="hover:text-ink">
              API dokümanı
            </a>
          </nav>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}

function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Matematik Lab ana sayfa">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
            <rect width="32" height="32" rx="7" fill="var(--ink)" />
            <path
              d="M4 18c3-9 6-9 8 0s5 9 8 0 5-9 8 0"
              fill="none"
              stroke="var(--c-hot)"
              strokeWidth="3"
              strokeLinecap="round"
              className="origin-center transition-transform duration-500 group-hover:scale-x-[-1]"
            />
          </svg>
          <span className="font-display text-[25px] leading-none tracking-tight text-ink">
            Matematik <em className="text-hot">Lab</em>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link to="/#konular" className="hidden rounded-md px-2 py-1 text-[14px] font-medium text-ink-2 hover:text-ink lg:block">
            Konular
          </Link>
          <NavLink
            to="/python-lab"
            className={({ isActive }) => `hidden rounded-md px-2 py-1 text-[14px] font-medium hover:text-ink lg:block ${isActive ? 'text-ink' : 'text-ink-2'}`}
          >
            Python Lab
          </NavLink>
          <ApiBadge />
          <UserMenu />
          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-rule text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            aria-label={theme === 'dark' ? 'Defter temasına geç' : 'Kara tahta temasına geç'}
            title={theme === 'dark' ? 'Defter teması' : 'Kara tahta teması'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function ApiBadge() {
  const status = useApiHealth();
  const label = status === 'online' ? 'Python API bağlı' : status === 'offline' ? 'Python API kapalı' : 'API kontrol ediliyor';
  const dot = status === 'online' ? 'bg-ok' : status === 'offline' ? 'bg-ink-3' : 'bg-pt animate-pulse';
  return (
    <span
      className="flex items-center gap-2 rounded-md border border-rule px-2.5 py-1.5 font-mono text-[11px] text-ink-2"
      title={status === 'offline' ? 'Simülasyonlar çalışır; adım adım çözüm ve hesap özellikleri için backend gerekir.' : label}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      <span className="hidden md:inline">{label}</span>
      <span className="sr-only md:hidden">{label}</span>
    </span>
  );
}

function UserMenu() {
  const { status, user, logout } = useAuth();
  const clear = useProgress((s) => s.clear);
  const navigate = useNavigate();
  if (status === 'unknown') return <span className="h-9 w-20" aria-hidden />;
  if (status === 'anonymous' || !user) {
    return (
      <>
        <NavLink to="/panel" className="hidden rounded-md px-2 py-1 text-[14px] font-medium text-ink-2 hover:text-ink md:block">
          İlerlemem
        </NavLink>
        <Link to="/giris" className="btn-primary !py-2">
          Giriş yap
        </Link>
      </>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <NavLink to="/tekrar" className="hidden rounded-md px-2 py-1 text-[14px] font-medium text-ink-2 hover:text-ink md:block">
        Tekrar
      </NavLink>
      <NavLink
        to="/panel"
        className="flex items-center gap-2 rounded-md border border-rule py-1 pr-2.5 pl-1 text-[14px] font-medium text-ink hover:border-ink-3"
        title="Panelim"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded bg-ink font-display text-[16px] text-bg">
          {user.display_name.slice(0, 1).toLocaleUpperCase('tr-TR')}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{user.display_name}</span>
      </NavLink>
      <button
        type="button"
        onClick={async () => {
          await logout();
          clear(); // ortak bilgisayarlarda bir sonraki kullanıcıya veri kalmasın
          navigate('/');
        }}
        className="hidden text-[13px] text-ink-3 hover:text-ink sm:block"
      >
        Çıkış
      </button>
    </div>
  );
}
