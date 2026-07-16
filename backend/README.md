# Backend API - Sistem Informasi Kepegawaian Mini

Backend API ini dibangun menggunakan Node.js (Express) dan Knex.js.

## Requirement
- Node.js versi LTS
- NPM

## Cara Setup Environment

1. Masuk ke direktori backend.
2. Install dependency:
   ```bash
   npm install
   ```
3. Konfigurasi file `.env` (secara default akan menggunakan SQLite untuk development lokal jika MariaDB tidak ada, namun Anda dapat mengatur DB_HOST, DB_USER, dll untuk MySQL/MariaDB di production/staging).

## Cara Migrate dan Seed Database

1. Jalankan migrasi database (skema awal):
   ```bash
   npx knex migrate:latest
   ```
2. Jalankan seeder (data master, role, admin):
   ```bash
   npx knex seed:run
   ```

## Menjalankan Aplikasi

Jalankan server:
```bash
node src/index.js
```
Aplikasi akan berjalan di `http://localhost:3001`.

## Dokumentasi API (Swagger)

Setelah server berjalan, Anda dapat melihat dokumentasi API interaktif pada URL:
`http://localhost:3001/api-docs`

## Autentikasi Default
- **Username:** `superadmin`
- **Password:** `Admin@123`
