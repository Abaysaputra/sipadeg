import { useEffect, useState } from 'react';
import api, { getErrorMessage, prepareCsrf } from './services/api';
import Workspace from './components/Workspace';

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

        if (active) {
          setSession('authenticated');
        }
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

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await prepareCsrf();

      await api.post('/login', {
        email: email.trim(),
        password,
      });

      // Pastikan sesi benar-benar bisa mengakses endpoint terlindungi.
      await api.get('/api/referensi');

      setPassword('');
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
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setSession('guest');
        setPassword('');
      } else {
        setError(getErrorMessage(requestError));
      }
    } finally {
      setBusy(false);
    }
  }

  if (session === 'loading') {
    return (
      <main className="status-screen" aria-live="polite">
        <span className="loading-dot" aria-hidden="true" />
        <p>Memeriksa sesi…</p>
      </main>
    );
  }

  if (session === 'error') {
    return (
      <main className="status-screen">
        <section className="welcome-card">
          <h1>Koneksi belum tersedia</h1>
          <p role="alert">{error}</p>

          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Coba kembali
          </button>
        </section>
      </main>
    );
  }

if (session === 'authenticated') {
  return (
    <Workspace
      onLogout={handleLogout}
      busy={busy}
      error={error}
      onSessionChange={setSession}
    />
  );
}

  return (
    <main className="login-layout">
      <section className="intro-panel">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SIDAPEG</span>
        </a>

        <div className="intro-content">
          <span className="eyebrow">SISTEM INFORMASI DATA PEGAWAI</span>

          <h1>
            Data tertata.
            <br />
            Kerja lebih mudah.
          </h1>

          <p>
            Kelola informasi pegawai dan pantau ringkasannya
            dalam satu tempat.
          </p>
        </div>

        <p className="intro-footer">Administrasi kepegawaian</p>
      </section>

      <section className="form-panel">
        <div className="login-card">
          <span className="eyebrow">AKSES ADMIN</span>
          <h2>Masuk ke akun</h2>
          <p className="form-description">
            Gunakan akun Admin untuk mengelola data pegawai.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="nama@perusahaan.com"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={busy}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Kata sandi</label>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={busy}
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Sedang masuk…' : 'Masuk'}
            </button>
          </form>

          <p className="login-note">
            Akses khusus pengelola data pegawai.
          </p>
        </div>
      </section>
    </main>
  );
}