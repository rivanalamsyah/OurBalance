# OurBalance — Personal Finance for Two

Aplikasi web manajemen keuangan pasangan modern yang dirancang untuk membantu dua pengguna (pasangan) mengelola finansial pribadi maupun bersama secara transparan, akurat, dan terstruktur.

---

### 1. Tentang OurBalance

OurBalance adalah platform pengelola keuangan berbasis web yang mengusung konsep **“Personal Finance for Two”**. Target penggunanya adalah pasangan yang ingin membangun transparansi finansial, mengontrol anggaran bersama, mencatat alokasi rekening, serta merencanakan target tabungan impian secara kolaboratif.

* **Production URL**: [https://ourbalance.web.app](https://ourbalance.web.app)
* **Repository GitHub**: [https://github.com/rivanalamsyah/OurBalance.git](https://github.com/rivanalamsyah/OurBalance.git)

---

### 2. Fitur Utama

* **Authentication**: Login & registrasi Email/Password serta Google Sign-In yang cepat dan aman.
* **Dashboard**: Ringkasan saldo total, arus kas bulanan, persentase anggaran, dan riwayat transaksi.
* **Transactions**: Pencatatan transaksi Pemasukan, Pengeluaran, Transfer antar rekening, dan Pengeluaran Bersama.
* **Accounts**: Pengelolaan rekening pribadi & bersama (Cash, Bank, E-Wallet, Credit, dll).
* **Budget**: Pemantauan batas anggaran bulanan per kategori dengan indikator peringatan.
* **Goals**: Perencanaan target impian finansial pribadi dan bersama.
* **Shared Finance**: Pencatatan pengeluaran bersama (*Shared Expenses*) dan pelunasan utang (*Settlement*).
* **Reports**: Grafik visual tren arus kas harian/bulanan dan pengeluaran per kategori.
* **Settings**: Pengaturan profil pengguna, koneksi akun pasangan, dan kustomisasi kategori.

---

### 3. Tech Stack

* **React 19** — Library UI berbasis komponen
* **TypeScript** — Type-safety penuh pada seluruh codebase
* **Vite** — Build tool & development server
* **React Router v7** — Routing aplikasi SPA & protected routes
* **Firebase Authentication** — Pengelolaan identitas Email/Password & Google Sign-In
* **Cloud Firestore** — Database NoSQL real-time
* **Firebase Hosting** — Media penyedia SSL dan deployment production
* **Firebase Spark Plan** — Konfigurasi infrastruktur gratis yang efisien

---

### 4. Arsitektur & Struktur Project

OurBalance menggunakan **Feature-Based Modular Architecture** dengan alur data sebagai berikut:

`Firebase SDK → Service Layer → Custom Hooks → Feature Pages → Reusable UI`

Struktur direktori utama:

```
src/
├── components/          # Reusable UI controls (Button, Modal, Table, Input) & Layout
├── constants/           # Router path definitions (routes.ts)
├── contexts/            # Global state (AuthContext.tsx, ToastContext.tsx)
├── features/            # Modul fitur terenkapsulasi
│   ├── accounts/        # Rekening pribadi & bersama
│   ├── auth/            # Halaman login/register & auth service
│   ├── budgets/         # Manajemen anggaran bulanan
│   ├── dashboard/       # Ringkasan KPI & grafik utama
│   ├── goals/           # Target tabungan impian
│   ├── reports/         # Laporan & analisis grafik
│   ├── settings/        # Profil, koneksi couple, & kategori
│   ├── shared/          # Pengeluaran bersama & settlement
│   └── transactions/    # Catatan transaksi & pencarian
├── layouts/             # AppLayout (Sidebar/BottomNav) & AuthLayout
├── lib/                 # Konfigurasi Firebase (firebase.ts)
├── types/               # TypeScript models (index.ts)
└── utils/               # Pure helper functions (format.ts)
```

---

### 5. Authentication & Security

* **Metode Login**: Mendukung Email/Password dan Google Sign-In via `GoogleAuthProvider` & `signInWithPopup`.
* **Session Persistence**: Session dipertahankan secara otomatis oleh Firebase listener `onAuthStateChanged`.
* **Protected Routes**: Membatasi halaman internal agar hanya dapat diakses pengguna terautentikasi.
* **Backend Authorization**: Hak akses data dijamin melalui Firestore Security Rules menggunakan verifikasi `isOwner(userId)` dan `isMember(coupleId)`.
* **Keamanan Kredensial**: Kredensial atau OAuth access token tidak pernah disimpan di `localStorage`.

---

### 6. Database

Menggunakan **Cloud Firestore** dengan struktur koleksi:

* `users`: Profil pengguna (`uid`, `email`, `displayName`, `photoURL`, `provider`).
* `couples`: Pasangan terhubung (`member1Id`, `member2Id`).
* `accounts`: Rekening finansial (`userId`, `coupleId`, `balance`, `isShared`).
* `categories`: Kategori transaksi (`coupleId`, `type`, `scope`).
* `transactions`: Transaksi keuangan (`userId`, `coupleId`, `amount`, `type`).
* `budgets`: Batas anggaran bulanan (`userId`, `coupleId`, `categoryId`, `amount`).
* `goals`: Target impian tabungan (`coupleId`, `targetAmount`, `currentAmount`).
* `sharedExpenses`: Pengeluaran bersama pasangan (`coupleId`, `paidBy`, `splits`).
* `settlements`: Catatan pelunasan utang (`coupleId`, `fromUserId`, `toUserId`).

---

### 7. Instalasi & Development

```bash
# 1. Clone repository
git clone https://github.com/rivanalamsyah/OurBalance.git
cd OurBalance

# 2. Install dependensi
npm install

# 3. Salin environment variable
cp .env.example .env
```

Sesuaikan `.env` dengan Firebase Web App config Anda:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=ourbalance.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ourbalance
VITE_FIREBASE_STORAGE_BUCKET=ourbalance.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Jalankan server pengembang:

```bash
npm run dev
```

---

### 8. Build, Testing & Deployment

Perintah pengujian dan deployment aktual yang tersedia pada `package.json`:

```bash
# TypeScript Type Check
npx tsc --noEmit

# Code Linting (Oxlint)
npm run lint

# Production Build
npm run build

# Preview Hasil Build Lokal
npm run preview

# Deploy ke Firebase Hosting
firebase deploy --only hosting
```

Target URL Production: [https://ourbalance.web.app](https://ourbalance.web.app)

---

### 9. Security, Data & Production Notes

* **Privasi Kredensial**: File `.env` dan `.env.local` terisolasi di `.gitignore`.
* **Backend Security**: Firestore Security Rules menjadi pengaman utama validasi hak akses.
* **Integritas Data**: Menggunakan data Firestore asli tanpa statistik atau dummy buatan pada produksi.
* **Efisiensi Spark Plan**: Query dioptimalkan dengan indeks komposit untuk menekan kuota Firestore.

---

### 10. Status Project & Dokumentasi

Status rilis produksi berdasarkan hasil audit aktual:

* **Production Status**: Production Ready
* **Build Status**: Passed (0 Errors)
* **Firebase Hosting**: Deployed (`ourbalance.web.app`)
* **Authentication**: Verified (Email/Password & Google Sign-In)
* **Firestore Integrity**: Verified
* **Security Rules**: Verified

Dokumentasi teknis lengkap tersedia di direktori `docs/`:

* [`docs/architecture.md`](file:///d:/OurBalance/docs/architecture.md) — Arsitektur & alur data aplikasi
* [`docs/database.md`](file:///d:/OurBalance/docs/database.md) — Schema Firestore & indeks
* [`docs/security.md`](file:///d:/OurBalance/docs/security.md) — Keamanan & Firestore Security Rules
* [`docs/deployment.md`](file:///d:/OurBalance/docs/deployment.md) — Prosedur deployment & rollback
* [`docs/development.md`](file:///d:/OurBalance/docs/development.md) — Panduan kontribusi pengembang
* [`docs/testing.md`](file:///d:/OurBalance/docs/testing.md) — Quality gates & checklist pengujian
* [`docs/audit.md`](file:///d:/OurBalance/docs/audit.md) — Laporan audit rilis produksi
