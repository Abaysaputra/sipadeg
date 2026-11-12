import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import EmployeeDialog from './EmployeeDialog';
import UiIcon from './UiIcon';
import './employees.css';

// Fungsi bantuan untuk menghasilkan nomor halaman (dengan '...' jika halaman banyak)
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default function EmployeeManager({ onSessionChange }) {
  const [employees, setEmployees] = useState([]);
  const [references, setReferences] = useState({ divisi: [], pendidikan: [] });
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState('');
  const [modal, setModal] = useState(null);
  const detailRequest = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => () => detailRequest.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [people, options] = await Promise.all([
          api.get('/api/pegawai', { signal: controller.signal }),
          api.get('/api/referensi', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setEmployees(people.data);
          setReferences(options.data);
        }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, division, itemsPerPage]);

  async function openEmployee(mode, id) {
    if (detailRequest.current) return;
    const controller = new AbortController();
    detailRequest.current = controller;
    setOpening(true);
    setError('');
    setNotice('');
    try {
      const response = await api.get('/api/pegawai/' + id, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setModal({ mode, employee: response.data });
      }
    } catch (requestError) {
      if (controller.signal.aborted) return;
      if (requestError.response?.status === 401) onSessionChange('guest');
      else if (requestError.response?.status === 404) {
        setNotice('Pegawai sudah tidak tersedia. Daftar sedang diperbarui.');
        setRefresh((value) => value + 1);
      } else setError(getErrorMessage(requestError));
    } finally {
      detailRequest.current = null;
      if (!controller.signal.aborted) setOpening(false);
    }
  }

  const keyword = search.trim().toLowerCase();
  const filtered = employees.filter((employee) =>
    (employee.nama.toLowerCase().includes(keyword) ||
      employee.nomor_pegawai.toLowerCase().includes(keyword)) &&
    (!division || String(employee.divisi_id) === division)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const endIndex = Math.min(startIndex + currentItems.length, filtered.length);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, totalPages)));
  }, [totalPages]);

  const locked = loading || opening;
  const canAdd = references.divisi.length > 0 && references.pendidikan.length > 0;

  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">DIREKTORI TIM</span><h1>Data Pegawai</h1><p>Semua informasi tim, tertata dalam satu tempat.</p></div>
        <div className="page-actions">
          <button className="secondary-button" disabled={locked}
            onClick={() => setRefresh((value) => value + 1)}><UiIcon name="refresh" size={17}/>Perbarui data</button>
          <button className="primary-button" disabled={locked || Boolean(error) || !canAdd}
            onClick={() => {
              setNotice('');
              setModal({ mode: 'add', employee: null });
            }}><UiIcon name="plus" size={18}/>Tambah pegawai</button>
        </div>
      </div>

      {notice && <p className="success-notice" role="status">{notice}</p>}
      {opening && <p className="content-state" role="status">Membuka data pegawai…</p>}
      {error && <p className="alert" role="alert">{error}</p>}
      {loading && <p className="content-state" role="status">Memuat daftar pegawai…</p>}

      {!loading && !error && (
        <section className="employee-card">
          {!canAdd && <p className="empty-note">Lengkapi data master divisi dan pendidikan sebelum menambah pegawai.</p>}
          <div className="table-toolbar">
            <div><div className="table-title"><h2>Daftar pegawai</h2><span className="count-badge">{employees.length}</span></div><p>{filtered.length} dari {employees.length} pegawai</p></div>
            
            <div className="employee-filters">
              <div className="search-field">
                <label htmlFor="employee-search">Cari pegawai</label>
                <input id="employee-search" type="search" value={search}
                  placeholder="Nama atau nomor pegawai"
                  onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div className="division-filter">
                <label htmlFor="division-filter">Divisi</label>
                <select id="division-filter" value={division}
                  onChange={(event) => setDivision(event.target.value)}>
                  <option value="">Semua divisi</option>
                  {references.divisi.map((item) => (
                    <option value={item.id} key={item.id}>{item.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="table-scroll" role="region" aria-label="Tabel data pegawai" tabIndex={0}>
            <table className="employee-table">
              <thead><tr>
                {['Pegawai', 'Jenis kelamin', 'Divisi', 'Pendidikan', 'Usia', 'Tindakan'].map(
                  (label) => <th scope="col" key={label}>{label}</th>
                )}
              </tr></thead>
              <tbody>
                {currentItems.map((employee) => (
                  <tr key={employee.id}>
                    <td><div className="employee-name">
                      <span className="employee-avatar" aria-hidden="true">{employee.nama.charAt(0).toUpperCase()}</span>
                      <div><strong>{employee.nama}</strong><small>{employee.nomor_pegawai}</small></div>
                    </div></td>
                    <td><span className={'gender-label ' + (employee.jenis_kelamin === 'L' ? 'male' : 'female')}><i aria-hidden="true"/>{employee.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></td>
                    <td>{employee.divisi}</td>
                    <td><span className="education-badge">{employee.pendidikan}</span></td>
                    <td>{employee.usia} tahun</td>
                    <td><div className="row-actions">
                      <button disabled={locked} onClick={() => openEmployee('detail', employee.id)}
                        aria-label={'Detail ' + employee.nama} title="Lihat detail"><UiIcon name="eye" size={17}/><span>Detail</span></button>
                      <button disabled={locked} onClick={() => openEmployee('edit', employee.id)}
                        aria-label={'Ubah ' + employee.nama} title="Ubah data"><UiIcon name="edit" size={17}/><span>Ubah</span></button>
                      <button disabled={locked} className="delete-action"
                        onClick={() => openEmployee('delete', employee.id)}
                        aria-label={'Hapus ' + employee.nama} title="Hapus pegawai"><UiIcon name="trash" size={17}/><span>Hapus</span></button>
                    </div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td className="empty-cell" colSpan={6}>
                  {employees.length ? 'Tidak ada pegawai yang sesuai pencarian.' : 'Belum ada data pegawai.'}
                </td></tr>}
              </tbody>
            </table>
          </div>
          
          {/* Kontainer Bawah: Dipisahkan penuh dari tabel */}
          <div className="table-bottom-container">
            <div className="table-bottom-info">
              <div className="table-bottom-note">
                <UiIcon name="check" size={16}/><span>Dibuat otomatis saat disimpan.</span>
              </div>
              <label className="page-size-control" htmlFor="employee-page-size">
                Tampilkan
                <select
                  id="employee-page-size"
                  value={itemsPerPage}
                  onChange={(event) => setItemsPerPage(Number(event.target.value))}
                >
                  {[5, 10, 25, 50].map((size) => <option value={size} key={size}>{size}</option>)}
                </select>
                data
              </label>
            </div>
            
            <div className="pagination-area">
              {filtered.length > 0 && (
                <span className="pagination-summary">
                  Menampilkan {startIndex + 1}-{endIndex} dari {filtered.length}
                </span>
              )}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-nav"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <UiIcon name="chevron-left" size={16}/> Sebelum
                  </button>

                  <div className="page-numbers">
                    {pageNumbers.map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    className="page-nav"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Lanjut <UiIcon name="chevron-right" size={16}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {modal && <EmployeeDialog mode={modal.mode} employee={modal.employee} references={references} onSessionChange={onSessionChange} onClose={() => setModal(null)} onComplete={(message) => { setModal(null); setNotice(message); setRefresh((value) => value + 1); }} />}
    </>
  );
}