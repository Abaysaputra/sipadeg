import { useEffect, useId, useRef, useState } from 'react';
import api, { getErrorMessage, prepareCsrf } from '../services/api';
import UiIcon from './UiIcon';
import './employees.css';
import './master-data.css';

const categories = [
  { key: 'divisi', label: 'Divisi', max: 100, icon: 'users', example: 'Contoh: Sumber Daya Manusia' },
  { key: 'pendidikan', label: 'Pendidikan', max: 30, icon: 'cap', example: 'Contoh: D4 atau S3' },
];

function MasterDialog({ category, mode, record, onClose, onComplete, onSessionChange }) {
  const dialogRef = useRef(null);
  const saving = useRef(false);
  const titleId = useId();
  const inputId = useId();
  const [nama, setNama] = useState(record?.nama ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const deleting = mode === 'delete';
  const title = `${deleting ? 'Hapus' : mode === 'add' ? 'Tambah' : 'Edit'} ${category.label.toLowerCase()}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (saving.current) return;
    const normalized = nama.trim().replace(/\s+/g, ' ');
    if (!deleting && !normalized) {
      setFieldError('Nama wajib diisi.');
      return;
    }
    saving.current = true;
    setBusy(true);
    setError('');
    setFieldError('');
    try {
      await prepareCsrf();
      const endpoint = '/api/master/' + category.key;
      if (deleting) {
        await api.delete(`${endpoint}/${record.id}`, { data: { konfirmasi: true } });
      } else if (mode === 'add') {
        await api.post(endpoint, { nama: normalized });
      } else {
        await api.put(`${endpoint}/${record.id}`, { nama: normalized });
      }
      onComplete(`${category.label} berhasil ${deleting ? 'dihapus' : mode === 'add' ? 'ditambahkan' : 'diperbarui'}.`);
    } catch (requestError) {
      const status = requestError.response?.status;
      const data = requestError.response?.data;
      if (status === 401) {
        onSessionChange('guest');
      } else if (status === 422) {
        setFieldError(data?.errors?.nama?.join(' ') ?? '');
        setError(data?.errors?.nama ? 'Periksa nama yang diisi.' : data?.message || 'Periksa data dan konfirmasi penghapusan.');
      } else if (status === 409) {
        setError(data?.message || 'Data master masih digunakan pegawai dan tidak dapat dihapus.');
      } else if (status === 404) {
        onComplete('Data master sudah tidak tersedia. Daftar dimuat ulang.');
      } else if (status === 419) {
        setError('Sesi perlu diperbarui. Coba kirim kembali.');
      } else if (!requestError.response) {
        setError('Respons server belum diterima. Tutup dialog dan perbarui daftar sebelum mengulang tindakan.');
      } else {
        setError(getErrorMessage(requestError));
      }
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <dialog ref={dialogRef} className="employee-dialog master-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!saving.current) onClose(); }}>
    <header className="dialog-heading">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="dialog-close" onClick={onClose} disabled={busy} aria-label="Tutup dialog">×</button>
    </header>
    <form onSubmit={submit}>
      {error && <p className="alert" role="alert">{error}</p>}
      {deleting ? <div className="delete-description">
        <p>Hapus <strong>{record.nama}</strong> dari data {category.label.toLowerCase()}?</p>
        <p>Data yang sudah dihapus tidak dapat dipulihkan melalui aplikasi. Server akan memeriksa ulang apakah data ini masih digunakan pegawai.</p>
      </div> : <fieldset disabled={busy} className="employee-form master-form">
        <div className="field">
          <label htmlFor={inputId}>Nama {category.label.toLowerCase()}</label>
          <input id={inputId} name="nama" value={nama} maxLength={category.max} required autoComplete="off"
            placeholder={category.example} aria-invalid={Boolean(fieldError)}
            aria-describedby={`${inputId}-help${fieldError ? ' ' + inputId + '-error' : ''}`}
            onChange={event => { setNama(event.target.value); setFieldError(''); }} />
          <small id={`${inputId}-help`}>Nama unik, maksimal {category.max} karakter.</small>
          {fieldError && <small id={`${inputId}-error`} className="field-error">{fieldError}</small>}
        </div>
        {mode === 'edit' && <p className="master-edit-note">Perubahan nama berlaku pada seluruh pegawai yang terhubung. ID data tetap sama.</p>}
      </fieldset>}
      <footer className="dialog-actions">
        <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Batal</button>
        <button type="submit" className={deleting ? 'danger-button' : 'primary-button'} disabled={busy}>
          {busy ? 'Memproses…' : deleting ? 'Ya, hapus' : 'Simpan'}
        </button>
      </footer>
    </form>
  </dialog>;
}

function MasterList({ category, onSessionChange }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const searchId = useId();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/master/' + category.key, { signal: controller.signal });
        if (!controller.signal.aborted) setRecords(data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 401) onSessionChange('guest');
        else if (requestError.response?.status === 404) setError('Endpoint data master belum tersedia. Pastikan routes/master.php sudah didaftarkan di backend.');
        else setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [category.key, refresh, onSessionChange]);

  const filtered = records.filter(record => record.nama.toLocaleLowerCase('id').includes(search.trim().toLocaleLowerCase('id')));
  const used = records.filter(record => Number(record.jumlah_pegawai) > 0).length;
  function open(mode, record = null) { setNotice(''); setModal({ mode, record }); }

  return <>
    <div className="master-toolbar">
      <div><h2>Daftar {category.label.toLowerCase()}</h2><p>Atur pilihan {category.label.toLowerCase()} untuk formulir pegawai.</p></div>
      <div className="page-actions">
        <button className="secondary-button" disabled={loading} onClick={() => setRefresh(v => v + 1)}>
          <UiIcon name="refresh" size={17} />Perbarui data
        </button>
        <button className="primary-button" disabled={loading || Boolean(error)} onClick={() => open('add')}>
          <UiIcon name="plus" size={18} />Tambah {category.label.toLowerCase()}
        </button>
      </div>
    </div>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {error && <p className="alert" role="alert">{error}</p>}
    {loading && <p className="content-state" role="status">Memuat data {category.label.toLowerCase()}…</p>}
    {!loading && !error && <section className="employee-card master-card">
      <div className="master-table-header">
        <div className="master-count"><span className="count-badge">{records.length}</span><span>data · {used} digunakan pegawai</span></div>
        <div className="master-search"><label htmlFor={searchId}>Cari {category.label.toLowerCase()}</label>
          <input id={searchId} type="search" placeholder={`Cari nama ${category.label.toLowerCase()}`} value={search} onChange={event => setSearch(event.target.value)} />
        </div>
      </div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={`Tabel ${category.label.toLowerCase()}`}>
        <table className="master-table">
          <thead><tr><th scope="col">Nama {category.label.toLowerCase()}</th><th scope="col">Jumlah pegawai</th><th scope="col">Aksi</th></tr></thead>
          <tbody>{filtered.map(record => {
            const inUse = Number(record.jumlah_pegawai) > 0;
            return <tr key={record.id}>
              <td><div className="master-name"><span className="master-avatar"><UiIcon name={category.icon} size={19} /></span><strong>{record.nama}</strong></div></td>
              <td><span className={'master-usage' + (inUse ? ' is-used' : '')}>{record.jumlah_pegawai} pegawai</span></td>
              <td><div className="master-actions">
                <button type="button" className="secondary-button" aria-label={`Edit ${record.nama}`} onClick={() => open('edit', record)}><UiIcon name="edit" size={16} />Edit</button>
                <button type="button" className="secondary-button master-delete" disabled={inUse}
                  aria-label={`Hapus ${record.nama}`} title={inUse ? 'Masih digunakan pegawai' : `Hapus ${record.nama}`}
                  onClick={() => open('delete', record)}><UiIcon name="trash" size={16} />Hapus</button>
              </div>{inUse && <small className="master-locked-note">Hapus terkunci: masih digunakan.</small>}</td>
            </tr>;
          })}
          {filtered.length === 0 && <tr><td colSpan={3} className="master-empty">{records.length ? 'Tidak ada data yang sesuai pencarian.' : `Belum ada data ${category.label.toLowerCase()}. Gunakan tombol Tambah untuk membuatnya.`}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="master-table-footer">Menampilkan {filtered.length} dari {records.length} data.</div>
    </section>}
    {modal && <MasterDialog category={category} mode={modal.mode} record={modal.record}
      onSessionChange={onSessionChange} onClose={() => setModal(null)}
      onComplete={message => { setModal(null); setNotice(message); setRefresh(v => v + 1); }} />}
  </>;
}

export default function MasterData({ onSessionChange }) {
  const [selected, setSelected] = useState('divisi');
  const tabsRef = useRef([]);
  const category = categories.find(item => item.key === selected);
  function moveTab(event, index) {
    const offsets = { ArrowRight: 1, ArrowLeft: -1 };
    let next;
    if (event.key in offsets) next = (index + offsets[event.key] + categories.length) % categories.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = categories.length - 1;
    else return;
    event.preventDefault();
    setSelected(categories[next].key);
    tabsRef.current[next]?.focus();
  }
  return <>
    <div className="page-heading"><div><span className="eyebrow">PENGATURAN REFERENSI</span><h1>Data Master</h1><p>Kelola divisi dan pendidikan yang digunakan dalam data pegawai.</p></div></div>
    <div className="master-info"><UiIcon name="check" size={20} /><p>Nama dapat diperbarui. Data yang masih digunakan pegawai hanya dapat dihapus setelah seluruh pegawai terkait dipindahkan ke pilihan lain.</p></div>
    <div className="master-tabs" role="tablist" aria-label="Jenis data master">
      {categories.map((item, index) => <button key={item.key} type="button" role="tab"
        id={`master-tab-${item.key}`} aria-controls={`master-panel-${item.key}`}
        aria-selected={selected === item.key} tabIndex={selected === item.key ? 0 : -1}
        ref={element => { tabsRef.current[index] = element; }}
        onKeyDown={event => moveTab(event, index)} onClick={() => setSelected(item.key)}>
        <UiIcon name={item.icon} size={18} />{item.label}
      </button>)}
    </div>
    <section role="tabpanel" id={`master-panel-${selected}`} aria-labelledby={`master-tab-${selected}`}>
      <MasterList key={selected} category={category} onSessionChange={onSessionChange} />
    </section>
  </>;
}
