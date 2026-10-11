import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../features/api/client';
import { useAuth } from '../features/auth/store';

function AuthCard({ title, lead, children, footer }: { title: string; lead: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rise rounded-2xl border border-rule-strong bg-elev p-7 shadow-[var(--shadow)]">
        <h1 className="font-display text-[44px] leading-none text-ink">{title}</h1>
        <p className="mt-2 text-[14px] text-ink-2">{lead}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-5 text-center text-[14px] text-ink-2">{footer}</p>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-rule-strong bg-bg px-3 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-ink';

export function LoginPage() {
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/panel');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş yapılamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Giriş yap"
      lead="İlerlemen, rozetlerin ve tekrar listen hesabında saklanır."
      footer={
        <>
          Hesabın yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-ink underline decoration-hot decoration-2 underline-offset-2">
            Kayıt ol
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kullanıcı adı">
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Parola">
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        {error && <p className="text-[13px] text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center !py-3 !text-[15px]">
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(username, password, displayName, consent);
      navigate('/panel');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kayıt olunamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Kayıt ol"
      lead="E-posta istemiyoruz: yalnızca bir kullanıcı adı ve parola yeter."
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link to="/giris" className="font-semibold text-ink underline decoration-hot decoration-2 underline-offset-2">
            Giriş yap
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Kullanıcı adı" hint="3–32 karakter: küçük harf, rakam, nokta, tire, alt çizgi.">
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
            pattern="[a-z0-9_.\-]{3,32}"
            required
          />
        </Field>
        <Field label="Görünen ad (isteğe bağlı)">
          <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={48} />
        </Field>
        <Field label="Parola" hint="En az 8 karakter.">
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-rule bg-bg/60 p-3 text-[13px] text-ink-2">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
          <span>
            <Link to="/kvkk" className="font-semibold text-ink underline underline-offset-2" target="_blank">
              KVKK aydınlatma metnini
            </Link>{' '}
            okudum; ilerleme verilerimin öğrenme deneyimi için işlenmesini kabul ediyorum. 18 yaşından küçüksem velimin onayı var.
          </span>
        </label>
        {error && <p className="text-[13px] text-bad">{error}</p>}
        <button type="submit" disabled={busy || !consent} className="btn-primary w-full justify-center !py-3 !text-[15px]">
          {busy ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>
    </AuthCard>
  );
}

export function KvkkPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <p className="eyebrow">Kişisel verilerin korunması</p>
      <h1 className="mt-2 font-display text-[52px] leading-none text-ink">KVKK aydınlatma metni</h1>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-2">
        <p>
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Matematik Lab kullanıcılarını bilgilendirmek için hazırlanmış bir
          <strong className="text-ink"> şablondur</strong>; uygulamayı yayına alan kişi veya kurum, kendi veri sorumlusu bilgileriyle güncellemelidir.
        </p>
        <h2 className="font-display text-[28px] text-ink">Hangi verileri işliyoruz?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kullanıcı adı ve (isteğe bağlı) görünen ad</li>
          <li>Parolanın geri döndürülemez özeti (Argon2) — parolanın kendisi saklanmaz</li>
          <li>Öğrenme verileri: tamamlanan ders adımları, tahmin sonuçları, çözülen görevler, quiz cevaplarının doğruluğu</li>
        </ul>
        <p>E-posta, telefon, okul, konum veya kimlik bilgisi istenmez. Üçüncü taraf izleme ya da reklam aracı kullanılmaz.</p>
        <h2 className="font-display text-[28px] text-ink">Neden işliyoruz?</h2>
        <p>Yalnızca öğrenme deneyimini sunmak için: ilerlemeni cihazlar arasında saklamak, aralıklı tekrar zamanlamak ve rozet vermek.</p>
        <h2 className="font-display text-[28px] text-ink">Haklarınız</h2>
        <p>
          Verilerine erişebilir ve <strong className="text-ink">hesabını tüm verileriyle birlikte kalıcı olarak silebilirsin</strong>: Panel sayfasındaki
          “Hesabımı sil” düğmesi bunu anında yapar. 18 yaşından küçük kullanıcılar için veli onayı gerekir.
        </p>
      </div>
    </article>
  );
}
