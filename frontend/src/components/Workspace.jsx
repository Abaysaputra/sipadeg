import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import Dashboard from './Dashboard';
import EmployeeManager from './EmployeeManager';
import MasterData from './MasterData';
import UiIcon from './UiIcon';
import './modernize.css';

function DashboardContent({ onSessionChange, onManage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/dashboard', { signal: controller.signal });
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 401) onSessionChange('guest');
        else setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [refresh, onSessionChange]);

  return <>
    <div className="page-heading">
      <div><span className="eyebrow">RUANG KERJA ANDA</span><h1>Dashboard</h1><p>Kenali tim Anda melalui data yang lebih jelas.</p></div>
      <button className="secondary-button" disabled={loading} onClick={() => setRefresh(v => v + 1)}>
        <UiIcon name="refresh" size={17}/>{loading ? 'Memuat…' : 'Perbarui data'}
      </button>
    </div>
    {loading && <div className="dashboard-loading" role="status"><span>Memuat ringkasan pegawai…</span><div className="skeleton-grid" aria-hidden="true">{[1,2,3,4].map(n => <i key={n}/>)}</div></div>}
    {!loading && error && <p className="alert" role="alert">{error}</p>}
    {!loading && !error && data && <Dashboard data={data} onManage={onManage}/>}
  </>;
}

export default function Workspace({ onLogout, busy, error, onSessionChange }) {
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  function navigate(next) { setView(next); setMenuOpen(false); }
  return <div className="admin-layout sidapeg-ui">
    <a className="skip-link" href="#sidapeg-content">Lewati ke konten</a>
    <aside className={'sidebar' + (menuOpen ? ' mobile-open' : '')}>
      <div className="sidebar-brand-row">
        <button className="brand" onClick={() => navigate('dashboard')} aria-label="Beranda SIDAPEG">
          <span className="brand-mark" aria-hidden="true"><span/><span/><span/></span>
          <span>SIDAPEG<span className="brand-caption">People management</span></span>
        </button>
        <button className="mobile-menu icon-button" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen} aria-controls="sidapeg-navigation" onClick={() => setMenuOpen(v => !v)}>
          <UiIcon name={menuOpen ? 'close' : 'menu'}/>
        </button>
      </div>
      <nav id="sidapeg-navigation" className="sidebar-nav" aria-label="Menu utama"
        onKeyDown={e => { if (e.key === 'Escape') setMenuOpen(false); }}>
        <p className="nav-caption">MENU UTAMA</p>
        {[{id:'dashboard',label:'Dashboard',icon:'grid'},{id:'employees',label:'Data Pegawai',icon:'users'},{id:'master',label:'Data Master',icon:'grid'}].map(menu =>
          <button key={menu.id} className={'nav-item ' + (view === menu.id ? 'active' : '')}
            aria-current={view === menu.id ? 'page' : undefined} onClick={() => navigate(menu.id)}>
            <UiIcon name={menu.icon}/><span>{menu.label}</span><UiIcon name="chevron" size={15}/>
          </button>)}
      </nav>
      <div className="sidebar-note"><span className="note-icon"><UiIcon name="check" size={26}/></span>
        <strong>Data tertata.<br/>Kerja lebih mudah.</strong><p>Kelola informasi tim dalam satu tempat.</p>
        <button onClick={() => navigate('employees')}>Buka data pegawai <UiIcon name="arrow" size={16}/></button>
      </div>
      <div className="sidebar-account"><span className="admin-avatar" aria-hidden="true">A</span><div><strong>Administrator</strong><small>Pengelola pegawai</small></div></div>
    </aside>
    <div className="admin-main">
      <header className="topbar">
        <div className="breadcrumb"><span>Workspace</span><UiIcon name="chevron" size={14}/><strong>{{dashboard:'Dashboard', employees:'Data Pegawai', master:'Data Master'}[view]}</strong></div>
        <div className="topbar-actions"><span className="account-label"><span className="account-dot"/>Admin</span>
          <button className="secondary-button logout-button" onClick={onLogout} disabled={busy}><UiIcon name="logout" size={17}/>{busy ? 'Memproses…' : 'Keluar'}</button>
        </div>
      </header>
      <main className="page-content" id="sidapeg-content" tabIndex={-1}>
        {error && <p className="alert" role="alert">{error}</p>}
        {view === 'dashboard' && <DashboardContent onSessionChange={onSessionChange} onManage={() => navigate('employees')}/>}
        {view === 'employees' && <EmployeeManager onSessionChange={onSessionChange}/>}
        {view === 'master' && <MasterData onSessionChange={onSessionChange}/>}
        <footer className="workspace-footer"><span>SIDAPEG</span><span>Sistem Informasi Data Pegawai</span></footer>
      </main>
    </div>
  </div>;
}
