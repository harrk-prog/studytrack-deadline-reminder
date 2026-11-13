# StudyTrack: Reminder Tugas Mendekati Deadline

Proyek ini mengembangkan starter kit StudyTrack dengan fitur penanda tugas berdasarkan waktu deadline, untuk bonus **Implementasi kode nyata** pada studi kasus seleksi Software Engineer, Academya Arkavidia 11.0.

Starter kit asli: [github.com/ZulfaNurhuda/StudyTrack](https://github.com/ZulfaNurhuda/StudyTrack). Bagian bawaan starter kit dan bagian yang saya tambahkan dipisahkan di bawah supaya jelas mana yang kode panitia dan mana yang kode saya.

Demo: [studytrack-deadline-reminder.vercel.app](https://studytrack-deadline-reminder.vercel.app). Akun demo di bagian [Akun Demo](#3-akun-demo) bisa dipakai di sana.

## Stack

- **Backend:** Node.js + Express. Data disimpan di file JSON, jadi tidak perlu memasang database terpisah.
- **Frontend:** React + Vite.

## Prasyarat

- Node.js 20.19 atau lebih baru (atau 22.12+), sesuai syarat Vite 8.
- npm.

## Fitur Bawaan Starter Kit

- Registrasi, login, dan logout. Password di-hash dengan bcrypt dan sesi memakai JWT.
- Manajemen Mata Kuliah: lihat, tambah, dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Manajemen Tugas per mata kuliah: lihat, tambah, ubah status (belum/selesai), dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Halaman Daftar Tugas: seluruh tugas pengguna lintas mata kuliah, urutannya mengikuti kategori reminder (lihat bagian berikutnya).

## Fitur Reminder Deadline (tambahan)

Setiap tugas dikelompokkan ke satu dari tiga kategori berdasarkan sisa waktu (`sisa = deadline - sekarang`).

| Kategori | Syarat | Tampilan |
| --- | --- | --- |
| `overdue` | sisa < 0 | Label merah "Overdue" |
| `mendekati` | 0 ≤ sisa < 24 jam | Label oranye "Mendekati Deadline" |
| `normal` | sisa ≥ 24 jam | Tanpa label |

Aturan yang berlaku:

- **Dua batas.** Sisa tepat 0 masih mendekati, sedangkan sisa tepat 24 jam sudah normal.
- **Tugas selesai** selalu normal, tanpa penanda.
- **Urutan.** Mendekati (deadline terdekat dulu), lalu overdue (yang paling baru terlewat dulu), lalu normal (`created_at` terbaru dulu).
- **Zona waktu.** `deadline` dibaca sebagai WIB (+07:00), jadi hasilnya sama di server mana pun.
- **Kategori dihitung backend** setiap `GET /tasks`, tidak disimpan di database.
- **Validasi.** `deadline` yang formatnya salah atau tanggalnya tidak ada (contoh 31 Februari) ditolak dengan status 400.
- **Halaman dimuat ulang** tiap 60 detik dan saat tab aktif kembali.

## Cara Menjalankan

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend berjalan di `http://localhost:4000`. Port dan `JWT_SECRET` bisa diatur lewat file `.env`.

### 2. Frontend

Buka terminal baru, lalu jalankan:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Selama mode development, request `/api/*` otomatis diteruskan ke backend oleh proxy Vite.

### 3. Akun Demo

File `backend/db.json` dibuat otomatis saat backend pertama kali dijalankan dan langsung berisi data seed. Anda bisa masuk dengan akun berikut:

| Email | Password |
| --- | --- |
| `demo@studytrack.test` | `demo1234` |

Untuk mengembalikan data ke kondisi seed kapan pun:

```bash
curl -X POST http://localhost:4000/api/dev/reset
```

Endpoint ini hanya aktif selama `NODE_ENV` bukan `production`.

### 4. Menjalankan Pengujian

```bash
cd backend
npm test
```

Hasilnya 16 pengujian untuk fungsi di [utils/taskReminder.js](backend/utils/taskReminder.js).

Di Windows, kalau PowerShell memblokir `npm`, pakai `npm.cmd test`.

## Struktur Data

Struktur ini mengikuti Bagian 1 (Konteks Aplikasi) pada dokumen studi kasus. Kolom `user_id` ditambahkan di luar daftar itu supaya setiap mahasiswa hanya melihat datanya sendiri.

**Mata kuliah** (`courses`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `name` | string | Nama mata kuliah |
| `kode` | string | Kode mata kuliah, contoh: `CS 186` |
| `dosen` | string | Nama dosen pengampu |
| `user_id` | integer | Pemilik data |

**Tugas** (`tasks`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `judul` | string | Judul tugas |
| `deskripsi` | string | Deskripsi atau catatan tambahan |
| `deadline` | datetime | Batas pengumpulan |
| `status` | enum | `belum` atau `selesai` |
| `mata_kuliah_id` | integer | Referensi ke mata kuliah terkait |
| `created_at` | datetime | Waktu tugas ditambahkan |
| `user_id` | integer | Pemilik data |

> **Format waktu.** `deadline` disimpan sebagai waktu lokal tanpa zona waktu, persis seperti keluaran input `datetime-local` (contoh: `2026-07-03T23:59`). Sementara itu `created_at` pada tugas baru berformat ISO 8601 UTC (contoh: `2026-10-23T09:00:00.000Z`). Karena perbedaan ini, `deadline` diberi akhiran `+07:00` sebelum dibandingkan dengan waktu sekarang.

## Data Seed

Data awal sama dengan contoh pada dokumen studi kasus:

| ID | Judul | Mata Kuliah | Deadline | Status |
| --- | --- | --- | --- | --- |
| 1 | Lab 4: Query Optimization Report | CS 186, Database Systems | 2026-07-03 23:59 | belum |
| 2 | Project 3: BSTMap Implementation | CS 61B, Data Structures | 2026-07-02 10:00 | belum |
| 3 | Sprint 2: Backend API Integration | CS 169, Software Engineering | 2026-07-06 23:59 | belum |

Semua data seed sudah lewat deadline, jadi akan tampil sebagai overdue. Untuk melihat label oranye, tambahkan tugas dengan deadline kurang dari 24 jam lagi lewat form **Tambah Tugas**.

## Ringkasan API

Semua endpoint di bawah `/api`. Endpoint bertanda "Ya" membutuhkan header `Authorization: Bearer <token>`.

| Method | Path | Login | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/health` | Tidak | Cek status server |
| `POST` | `/auth/register` | Tidak | Daftar akun baru |
| `POST` | `/auth/login` | Tidak | Login, mengembalikan token |
| `GET` | `/auth/me` | Ya | Profil pengguna yang sedang login |
| `GET` | `/courses` | Ya | Daftar mata kuliah |
| `POST` | `/courses` | Ya | Tambah mata kuliah |
| `PUT` | `/courses/:id` | Ya | Ubah mata kuliah |
| `DELETE` | `/courses/:id` | Ya | Hapus mata kuliah beserta tugasnya |
| `GET` | `/tasks` | Ya | Daftar seluruh tugas, lintas mata kuliah. Menambahkan field `kategori` dan mengurutkan sesuai aturan reminder |
| `GET` | `/tasks/:id` | Ya | Detail satu tugas |
| `POST` | `/tasks` | Ya | Tambah tugas (`mata_kuliah_id`, `judul`, `deadline`, `deskripsi?`). `deadline` divalidasi, 400 kalau tidak valid |
| `PUT` | `/tasks/:id` | Ya | Ubah tugas, termasuk status. `deadline` divalidasi kalau ikut dikirim |
| `DELETE` | `/tasks/:id` | Ya | Hapus tugas |
| `POST` | `/dev/reset` | Tidak | Reset data ke seed (hanya di luar production) |

## Struktur Proyek

```
studytrack-deadline-reminder/
├── backend/
│   ├── server.js            # Entry point Express
│   ├── config.js            # Membaca .env (PORT, JWT_SECRET)
│   ├── db.js                # Penyimpanan JSON file dan data seed
│   ├── middleware/auth.js   # Verifikasi JWT
│   ├── routes/
│   │   ├── auth.js          # Register, login, profil
│   │   ├── courses.js       # CRUD mata kuliah
│   │   └── tasks.js         # CRUD tugas + kategori
│   ├── utils/
│   │   └── taskReminder.js  # Logika kategori, urutan, dan validasi deadline
│   └── tests/
│       └── taskReminder.test.js  # Pengujian fungsi reminder
└── frontend/
    ├── vercel.json          # Rewrite /api/* ke backend dan route lain ke index.html
    └── src/
        ├── main.jsx, App.jsx, AuthContext.jsx, api.js
        ├── index.css        # Gaya tampilan, termasuk penanda
        ├── components/
        │   ├── Navbar.jsx
        │   └── TaskCard.jsx # Card tugas + penanda
        └── pages/
            ├── Login.jsx, Register.jsx
            ├── Courses.jsx
            └── Tasks.jsx    # Halaman Daftar Tugas
```

## Batasan

- Pengguna di luar WIB belum didukung.
- Pengujian API (dua akun, tanpa token, validasi) dilakukan manual.
- Data di demo bersifat sementara dan kembali ke data seed saat redeploy atau saat instance dimatikan.
- Di server Vercel yang diuji ulang hanya kategori lewat API. Delapan skenario lengkap diuji di komputer lokal.

## Deployment

- **Backend:** project Vercel dengan root `backend` dan preset Express. Environment variable yang dipasang: `JWT_SECRET` (string acak) dan `NODE_ENV=production`.
- **Frontend:** project Vercel kedua dengan root `frontend` dan preset Vite. `vercel.json` meneruskan `/api/*` ke backend dan mengarahkan route lain ke `index.html`, jadi `baseURL: "/api"` tidak perlu diubah.
- **Penyimpanan:** di Vercel, folder aplikasi bersifat read-only, jadi `db.json` ditulis ke folder temporary (`os.tmpdir()`).
- **Hosting satu server (alternatif):** jalankan `npm run build` di `frontend`, lalu jalankan backend dengan `NODE_ENV=production`. Express akan menyajikan `frontend/dist`.
