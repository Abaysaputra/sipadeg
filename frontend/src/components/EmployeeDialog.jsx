import { useEffect, useId, useRef, useState } from 'react';
import api, { prepareCsrf } from '../services/api';

export default function EmployeeDialog({
  mode, employee, references, onClose, onComplete, onSessionChange,
}) {
  const dialogRef = useRef(null);
  const headingId = useId();
  const savingRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nama: employee?.nama ?? '',
    jenis_kelamin: employee?.jenis_kelamin ?? '',
    tanggal_lahir: employee?.tanggal_lahir?.slice(0, 10) ?? '',
    divisi_id: employee?.divisi_id ?? '',
    pendidikan_id: employee?.pendidikan_id ?? '',
  });
  const titles = {
    add: 'Tambah pegawai', edit: 'Ubah pegawai',
    detail: 'Detail pegawai', delete: 'Hapus pegawai?',
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setBusy(true);
    setError('');
    setErrors({});

    try {
      await prepareCsrf();
      let message = 'Data pegawai berhasil disimpan.';
      if (mode === 'delete') {
        await api.delete('/api/pegawai/' + employee.id, {
          data: { konfirmasi: true },
        });
        message = 'Pegawai berhasil dihapus.';
      } else {
        const payload = {
          ...form,
          nama: form.nama.trim(),
          divisi_id: Number(form.divisi_id),
          pendidikan_id: Number(form.pendidikan_id),
        };
        if (mode === 'add') {
          const { data } = await api.post('/api/pegawai', payload);
          message = 'Pegawai berhasil ditambahkan dengan nomor ' + data.nomor_pegawai + '.';
        } else {
          await api.put('/api/pegawai/' + employee.id, payload);
        }
      }
      onComplete(message);
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 401) {
        onSessionChange('guest');
        return;
      }
      if (status === 422) {
        setErrors(requestError.response.data.errors ?? {});
        setError('Periksa kolom yang ditandai, lalu simpan kembali.');
      } else if (status === 419) {
        setError('Sesi perlu diperbarui. Coba simpan kembali.');
      } else if (status === 404) {
        setError('Pegawai sudah tidak tersedia. Tutup dialog lalu perbarui daftar.');
      } else if (!requestError.response) {
        setError('Respons server belum diterima. Periksa daftar sebelum mengulang tindakan.');
      } else {
        setError('Server gagal memproses permintaan. Coba kembali setelah memeriksa server.');
      }
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  }

  function fieldError(name) {
    return errors[name] && (
      <small id={headingId + '-' + name} className="field-error">
        {errors[name].join(' ')}
      </small>
    );
  }

  function inputProps(name) {
    return {
      id: 'pegawai-' + name,
      name,
      value: form[name],
      onChange: change,
      required: true,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? headingId + '-' + name : undefined,
    };
  }

  const today = new Date();
  const maxDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return (
    <dialog
      ref={dialogRef}
      className="employee-dialog"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (!savingRef.current) onClose();
      }}
    >
      <header className="dialog-heading">
        <h2 id={headingId}>{titles[mode]}</h2>
        <button type="button" className="dialog-close" aria-label="Tutup dialog"
          onClick={onClose} disabled={busy}>×</button>
      </header>

      {mode === 'detail' ? (
        <>
          <dl className="employee-details">
            {[
              ['Nomor pegawai', employee.nomor_pegawai],
              ['Nama', employee.nama],
              ['Jenis kelamin', employee.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
              ['Tanggal lahir', employee.tanggal_lahir.slice(0, 10)],
              ['Usia', employee.usia + ' tahun'],
              ['Divisi', employee.divisi],
              ['Pendidikan terakhir', employee.pendidikan],
            ].map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose}>Tutup</button>
          </footer>
        </>
      ) : (
        <form onSubmit={submit}>
          {error && <p className="alert" role="alert">{error}</p>}

          {mode === 'delete' ? (
            <div className="delete-description">
              <p>Hapus data <strong>{employee.nama}</strong>?</p>
              <p>Nomor pegawai <strong>{employee.nomor_pegawai}</strong></p>
              <p>Data yang dihapus tidak dapat dipulihkan melalui aplikasi.</p>
            </div>
          ) : (
            <fieldset disabled={busy} className="employee-form">
              <div className="field">
                <label htmlFor="pegawai-nomor_pegawai">Nomor pegawai</label>
                <input id="pegawai-nomor_pegawai" readOnly
                  value={mode === 'edit' ? employee.nomor_pegawai : ''}
                  placeholder="Dibuat otomatis setelah disimpan"
                  aria-describedby={headingId + '-nomor-help'} />
                <small id={headingId + '-nomor-help'}>
                  {mode === 'edit'
                    ? 'Nomor pegawai tetap dan tidak dapat diubah.'
                    : 'Cukup isi data pegawai. Sistem akan menentukan nomornya.'}
                </small>
                {fieldError('nomor_pegawai')}
              </div>
              <div className="field">
                <label htmlFor="pegawai-nama">Nama lengkap</label>
                <input {...inputProps('nama')} maxLength={100} />
                {fieldError('nama')}
              </div>
              <div className="field">
                <label htmlFor="pegawai-jenis_kelamin">Jenis kelamin</label>
                <select {...inputProps('jenis_kelamin')}>
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                {fieldError('jenis_kelamin')}
              </div>
              <div className="field">
                <label htmlFor="pegawai-tanggal_lahir">Tanggal lahir</label>
                <input {...inputProps('tanggal_lahir')} type="date" max={maxDate} />
                {fieldError('tanggal_lahir')}
              </div>
              <div className="field">
                <label htmlFor="pegawai-divisi_id">Divisi</label>
                <select {...inputProps('divisi_id')}>
                  <option value="">Pilih divisi</option>
                  {references.divisi.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}</option>
                  ))}
                </select>
                {fieldError('divisi_id')}
              </div>
              <div className="field">
                <label htmlFor="pegawai-pendidikan_id">Pendidikan terakhir</label>
                <select {...inputProps('pendidikan_id')}>
                  <option value="">Pilih pendidikan</option>
                  {references.pendidikan.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}</option>
                  ))}
                </select>
                {fieldError('pendidikan_id')}
              </div>
            </fieldset>
          )}

          <footer className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" disabled={busy}
              className={mode === 'delete' ? 'danger-button' : 'primary-button'}>
              {busy ? 'Memproses…' : mode === 'delete' ? 'Ya, hapus pegawai' : 'Simpan'}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
