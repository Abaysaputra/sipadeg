import { useEffect, useState } from 'react';
import api, { getErrorMessage, prepareCsrf } from './services/api';
import Workspace from './components/Workspace';
import './App.css';

function Brand() {
  return (
    <a className="brand" href="/" aria-label="SIDAPEG, halaman utama">
      <span className="brand-mark" aria-hidden="true">
        <span /><span /><span />
      </span>
      <span>SIDAPEG<small>Sistem Informasi Data Pegawai</small></span>
    </a>
  );
}

// Ilustrasi dekoratif lokal, tanpa gambar atau dependency tambahan.
function EmployeeIllustration() {
  return (
    <div className="employee-art" aria-hidden="true">
      <div className="art-circle" />
      <div className="art-spark spark-one" />
      <div className="art-spark spark-two" />
      <div className="art-back-card"><span /><span /><span /></div>
      <div className="art-profile">
        <div className="art-profile-top"><i /><span /><span /></div>
        <div className="art-person">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="23" r="11" fill="currentColor" />
            <path d="M12 55c0-12 8-19 20-19s20 7 20 19" fill="currentColor" />
          </svg>
        </div>
        <span className="art-line long" /><span className="art-line" />
        <div className="art-tags"><span /><span /></div>
      </div>
      <div className="art-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        await api.get('/api/referensi');
        if (active) setSession('authenticated');
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 401) {
          setSession('guest');
        } else {
          setError(getErrorMessage(requestError));
          setSession('error');
        }
      }
    }
    checkSession();
    return () => { active = false; };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await prepareCsrf();
      await api.post('/login', { email: email.trim(), password });
      await api.get('/api/referensi');
      setPassword('');
      setShowPassword(false);
      setSession('authenticated');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await prepareCsrf();
      await api.post('/logout');
      setSession('guest');
      setPassword('');
      setShowPassword(false);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setSession('guest');
        setPassword('');
        setShowPassword(false);
      } else {
        setError(getErrorMessage(requestError));
      }
    } finally {
      setBusy(false);
    }
  }

  if (session === 'loading') {
    return (
      <main className="sidapeg-auth status-screen" aria-live="polite" aria-busy="true">
        <span className="loading-dot" aria-hidden="true" />
        <p>Memeriksa sesi…</p>
      </main>
    );
  }

  if (session === 'error') {
    return (
      <main className="sidapeg-auth status-screen">
        <section className="connection-card">
          <span className="connection-icon" aria-hidden="true">!</span>
          <h1>Koneksi belum tersedia</h1>
          <p role="alert">{error}</p>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            Coba kembali
          </button>
        </section>
      </main>
    );
  }

  if (session === 'authenticated') {
    return <Workspace onLogout={handleLogout} busy={busy} error={error} onSessionChange={setSession} />;
  }

  return (
    <main className="sidapeg-auth login-layout">
      <section className="intro-panel" aria-labelledby="intro-title">
        <Brand />
        <div className="intro-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> ADMINISTRASI KEPEGAWAIAN</span>
          <h1 id="intro-title">Data tertata.<br /><span>Kerja lebih mudah.</span></h1>
          <p>Kelola informasi pegawai dan pantau ringkasannya dalam satu tempat.</p>
          <EmployeeIllustration />
          <div className="intro-features">
            <span>Data terpusat</span><span>Ringkasan visual</span><span>Mudah dikelola</span>
          </div>
        </div>
        <p className="intro-footer">Ruang kerja yang lebih rapi, setiap hari.</p>
      </section>

      <section className="form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <span className="login-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" strokeLinecap="round" />
            </svg>
            AKSES ADMIN
          </span>
          <h2 id="login-title">Selamat datang kembali</h2>
          <p className="form-description">Masuk untuk mulai mengelola data pegawai Anda.</p>

          <form onSubmit={handleLogin} aria-busy={busy}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" placeholder="nama@perusahaan.com"
                autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)}
                required disabled={busy} />
            </div>

            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <div className="password-field">
                <input id="password" type={showPassword ? 'text' : 'password'} name="password"
                  placeholder="Masukkan kata sandi" autoComplete="current-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
                <button className="password-toggle" type="button" disabled={busy}
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword} aria-controls="password">
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            {error && <div className="alert" role="alert">{error}</div>}

            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? <><span className="button-spinner" aria-hidden="true" /> Sedang masuk…</> : <>
                Masuk
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>}
            </button>
          </form>
          <p className="login-note">Akses khusus pengelola data pegawai.</p>
        </div>
        <p className="form-footer">SIDAPEG · Sistem Informasi Data Pegawai</p>
      </section>
    </main>
  );
}
