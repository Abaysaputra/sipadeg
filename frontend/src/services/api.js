import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
  withCredentials: true,

  headers: {
    Accept: 'application/json',
  },
});

// Ambil cookie sebelum operasi yang membutuhkan CSRF.
// Axios membaca XSRF-TOKEN dan mengirim header X-XSRF-TOKEN
// untuk request dari browser ke origin yang sama.
export async function prepareCsrf() {
  await api.get('/sanctum/csrf-cookie');
}

export function getErrorMessage(error) {
  const status = error.response?.status;

  if (!error.response) {
    return 'Server belum dapat dihubungi. Periksa koneksi dan server Laravel.';
  }

  if (status === 419) {
    return 'Sesi perlu diperbarui. Silakan coba masuk kembali.';
  }

  if (status === 429) {
    return 'Terlalu banyak percobaan. Tunggu satu menit, lalu coba lagi.';
  }

  if (status === 422) {
    return 'Periksa kembali email dan kata sandi yang kamu masukkan.';
  }

  return 'Terjadi kendala pada server. Silakan coba kembali.';
}

export default api;