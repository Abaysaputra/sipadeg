import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import Dashboard from './Dashboard';

function EmployeeTable({ employees }) {
  const [search, setSearch] = useState('');

  const keyword = search.trim().toLowerCase();

  const filtered = employees.filter((employee) => {
    const name = employee.nama.toLowerCase();
    const number = employee.nomor_pegawai.toLowerCase();

    return name.includes(keyword) || number.includes(keyword);
  });

  return (
    <section className="employee-card">
      <div className="table-toolbar">
        <div>
          <h2>Daftar pegawai</h2>
          <p>
            {filtered.length} dari {employees.length} pegawai
          </p>
        </div>

        <div className="search-field">
          <label htmlFor="employee-search">Cari pegawai</label>
          <input
            id="employee-search"
            type="search"
            placeholder="Nama atau nomor pegawai"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div
        className="table-scroll"
        role="region"
        aria-label="Tabel data pegawai"
        tabIndex={0}
      >
        <table className="employee-table">
          <thead>
            <tr>
              <th scope="col">Pegawai</th>
              <th scope="col">Jenis kelamin</th>
              <th scope="col">Divisi</th>
              <th scope="col">Pendidikan</th>
              <th scope="col">Usia</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <div className="employee-name">
                    <span className="employee-avatar" aria-hidden="true">
                      {employee.nama.charAt(0).toUpperCase()}
                    </span>

                    <div>
                      <strong>{employee.nama}</strong>
                      <small>{employee.nomor_pegawai}</small>
                    </div>
                  </div>
                </td>

                <td>
                  {employee.jenis_kelamin === 'L'
                    ? 'Laki-laki'
                    : 'Perempuan'}
                </td>

                <td>{employee.divisi}</td>

                <td>
                  <span className="education-badge">
                    {employee.pendidikan}
                  </span>
                </td>

                <td>{employee.usia} tahun</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {employees.length === 0
                    ? 'Belum ada data pegawai.'
                    : 'Pegawai yang dicari belum ditemukan.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WorkspaceContent({ view, onSessionChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError('');

      const endpoint =
        view === 'dashboard' ? '/api/dashboard' : '/api/pegawai';

      try {
        const response = await api.get(endpoint, {
          signal: controller.signal,
        });

        setData(response.data);
      } catch (requestError) {
        if (controller.signal.aborted) return;

        if (requestError.response?.status === 401) {
          onSessionChange('guest');
        } else {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [view, refreshCount, onSessionChange]);

  const isDashboard = view === 'dashboard';

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{isDashboard ? 'Dashboard' : 'Data Pegawai'}</h1>
          <p>
            {isDashboard
              ? 'Ringkasan data pegawai dalam satu tampilan.'
              : 'Temukan informasi pegawai yang kamu butuhkan.'}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setRefreshCount((count) => count + 1)}
          disabled={loading}
        >
          {loading ? 'Memuat…' : 'Perbarui data'}
        </button>
      </div>

      {loading && (
        <div className="content-state" role="status">
          Sedang mengambil data…
        </div>
      )}

      {!loading && error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        isDashboard
          ? <Dashboard data={data} />
          : <EmployeeTable employees={data} />
      )}
    </>
  );
}

export default function Workspace({
  onLogout,
  busy,
  error,
  onSessionChange,
}) {
  const [view, setView] = useState('dashboard');

  const menus = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'employees', label: 'Data Pegawai' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Beranda SIDAPEG">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SIDAPEG</span>
        </a>

        <nav className="sidebar-nav" aria-label="Menu utama">
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className={`nav-item ${view === menu.id ? 'active' : ''}`}
              aria-current={view === menu.id ? 'page' : undefined}
              onClick={() => setView(menu.id)}
            >
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-account">
          <span className="admin-avatar" aria-hidden="true">A</span>
          <div>
            <strong>Admin</strong>
            <small>Pengelola pegawai</small>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <span>Sistem Informasi Data Pegawai</span>

          <button
            type="button"
            className="secondary-button"
            onClick={onLogout}
            disabled={busy}
          >
            {busy ? 'Memproses…' : 'Keluar'}
          </button>
        </header>

        <main className="page-content">
          {error && (
            <div className="alert" role="alert">{error}</div>
          )}

          <WorkspaceContent
            key={view}
            view={view}
            onSessionChange={onSessionChange}
          />
        </main>
      </div>
    </div>
  );
}