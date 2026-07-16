# Sistem Kepegawaian & Kalkulasi Tunjangan Transport (Mini)

Aplikasi *Fullstack* berbasis Node.js (Express) dan Vue.js (Nuxt 3) untuk memanajemen data pegawai serta melakukan kalkulasi tunjangan transport bulanan.

## Persyaratan Sistem
- **Node.js** v18+ atau terbaru
- **MariaDB** atau **MySQL** (untuk *production/development* jika menggunakan MySQL, walau secara default aplikasi ini berjalan dengan **SQLite** khusus untuk lingkungan *development* agar mempermudah setup).
- **npm** (Node Package Manager)

---

## 1. Konfigurasi Lingkungan (*Environment Setup*)

### Backend (`/backend`)
Secara *default*, *backend* berjalan di `http://localhost:3001` dan menggunakan *database* lokal SQLite. 

Buat file `.env` di dalam folder `backend` dengan menyalin contoh yang ada (jika tersedia), atau isi dengan variabel berikut:

```env
PORT=3001
JWT_SECRET=super_secret_jwt_key_jmc_technical_test
JWT_EXPIRES_IN=1d

# Jika ingin menggunakan MySQL / MariaDB (ubah driver di knexfile.js):
# DB_CLIENT=mysql2
# DB_HOST=127.0.0.1
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=jmc_kepegawaian
```

### Frontend (`/frontend`)
Secara *default*, *frontend* berjalan di `http://localhost:3000`.

Buat file `.env` di dalam folder `frontend` dengan konfigurasi berikut:

```env
API_BASE_URL=http://localhost:3001/api
APP_NAME="Sistem Kepegawaian"
APP_CLIENT="JMC IT Consultant"
```

---

## 2. Cara Menjalankan Aplikasi

### Setup Backend
Buka terminal dan arahkan ke folder `backend`:
```bash
cd backend
npm install

# Jalankan migrasi dan seeding database (wajib untuk setup awal)
npm run migrate
npm run seed

# Jalankan server
npm run dev
```

### Setup Frontend
Buka terminal baru dan arahkan ke folder `frontend`:
```bash
cd frontend
npm install

# Jalankan server frontend
npm run dev
```

---

## 3. Akun Default (Seeder)

Gunakan akun berikut untuk mencoba masuk ke sistem:

- **Superadmin**: `superadmin` / `Admin@123`
- **Manager HRD**: `manager123` / `Manager@123`
- **Admin HRD**: `admin123` / `Admin@123`


---



## 4. Dokumentasi API (Swagger)

Aplikasi ini sudah dilengkapi dengan dokumentasi API interaktif menggunakan **Swagger**.
Setelah server backend menyala, Anda bisa mengakses dokumentasi lengkap seluruh *endpoint* (termasuk fitur Kalkulasi Tunjangan) pada tautan berikut:

👉 **[http://localhost:3001/api-docs](http://localhost:3001/api-docs)**

**Fitur Swagger:**
- **Detail Endpoint**: Terdapat informasi lengkap mengenai URL, HTTP Method (GET, POST, PUT, DELETE).
- **Request / Response Body**: Penjelasan skema JSON yang dibutuhkan dan dikembalikan.
- **Autorisasi (Bearer Token)**: Anda dapat melakukan simulasi permintaan (*request*) API langsung dari Swagger dengan memasukkan token JWT melalui tombol `Authorize`.

---

## 5. Fitur Utama

- **Authentication & RBAC**: Login, Logout, Cookie Sessions, dan Manajemen Hak Akses (Superadmin, HRD, Pegawai).
- **Master Data**: Kelola data agama, wilayah (provinsi, kota, kecamatan, kelurahan), dll.
- **Data Pegawai**: Manajemen informasi pegawai termasuk unggah foto profil (dengan validasi *magic bytes*).
- **Tunjangan Transport**: Setting jarak, tarif per km, dan kalkulator massal tunjangan berdasarkan jarak rumah - kantor.
- **Audit Log / Activity Logging**: Perekaman otomatis jejak *user* setiap kali login, logout, ekspor PDF/Excel, hingga aktivitas CRUD.
