# SIDAPEG | Setup lokal Windows
Paket ini adalah overlay untuk proyek baru Laravel 13 dan React. Gunakan Terminal Laragon (CMD). Nyalakan MySQL dan Apache lewat Start All. Siapkan PHP 8.3 atau lebih baru dengan pdo_mysql, Composer 2 dan Node.js 22.12+ (cabang 22 atau LTS yang lebih baru). Cek php -v, composer -V, node -v dan npm -v.

## 1. Siapkan folder
Ekstrak ZIP ke C:\laragon\www\sidapeg. Pastikan starter, sidapeg.sql dan PANDUAN.md langsung ada di dalam folder sidapeg. Gunakan folder proyek baru.
```bat
cd /d C:\laragon\www\sidapeg
composer create-project laravel/laravel backend "13.*"
cd backend
composer require laravel/sanctum
copy /Y ..\starter\backend\routes\web.php routes\web.php
```
Sanctum menggunakan sesi web. Rute ditempatkan di web.php supaya middleware sesi dan CSRF aktif.

## 2. Impor database
Di phpMyAdmin pilih tab SQL tingkat server, tempel seluruh isi sidapeg.sql dan klik Go. Alternatif: tab Import, pilih sidapeg.sql. Gunakan database sidapeg baru dan jalankan satu kali. Skrip membuat sendiri database, tabel aplikasi, satu admin dan enam pegawai fiktif. Jika database sidapeg sudah digunakan proyek lain, pilih nama baru di CREATE DATABASE, USE, dan DB_DATABASE sebelum impor. Gunakan skrip ini sebagai sumber skema MySQL awal. Jangan menjalankan migrasi users bawaan terhadap skema ini karena tabel users sudah dibuat oleh SQL.

## 3. Konfigurasi Laravel
Edit backend\.env. Ganti entri yang sudah ada dan aktifkan baris DB yang dikomentari. Sesuaikan port serta password dengan MySQL Laragon milik Anda.
```dotenv
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sidapeg
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173
```
Pertahankan APP_KEY yang dibuat Composer. Jika kosong, jalankan php artisan key:generate. Jalankan backend pada terminal pertama:
```bat
cd /d C:\laragon\www\sidapeg\backend
php artisan config:clear
php artisan route:list
php artisan serve --host=127.0.0.1 --port=8000
```
## 4. Pasang React
Di Terminal Laragon kedua:
```bat
cd /d C:\laragon\www\sidapeg
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios
copy /Y ..\starter\frontend\src\App.jsx src\App.jsx
copy /Y ..\starter\frontend\vite.config.js vite.config.js
npm run dev
```
Jika Vite menawarkan menjalankan dev server otomatis saat scaffolding, pilih No agar dapat menyelesaikan perintah berikutnya. Buka http://127.0.0.1:5173. Proxy Vite meneruskan permintaan aplikasi ke Laravel pada port 8000.

## 5. Uji penerimaan
- Sebelum login, buka http://127.0.0.1:5173 di jendela privat. Form login muncul.
- Masukkan admin@sidapeg.test dengan password keliru. Form menampilkan kesalahan.
- Masuk dengan password DemoPegawai26! dan email tadi. Harus terlihat enam pegawai PG001–PG006 beserta nama divisi dan pendidikan.
- Refresh. Daftar tetap terbuka karena sesi masih aktif. Klik Keluar lalu refresh. Form login tampil kembali.
- Di phpMyAdmin: SELECT jenis_kelamin, COUNT(*) FROM sidapeg.pegawai GROUP BY jenis_kelamin; menghasilkan L=3 dan P=3.
- Bila muncul 419, buka aplikasi dengan alamat persis di atas, cek cookie aktif dan pastikan backend serta proxy memakai port yang sama dengan panduan. Untuk SQLSTATE access denied, periksa kredensial MySQL di .env lalu jalankan php artisan config:clear.

