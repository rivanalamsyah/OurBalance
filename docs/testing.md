# Pengujian & Quality Gates — OurBalance

Sistem verifikasi kualitas aplikasi OurBalance mencakup pengujian kompilasi statis (TypeScript), bundling produksi (Vite), dan smoke testing fungsional pada hasil build.

---

## 1. Quality Gates (Langkah Pengujian Wajib)

Setiap rilis aplikasi harus memenuhi urutan pengujian berikut:

1. **TypeScript Type Verification**:
   ```bash
   npx tsc --noEmit
   ```
   *Ekspektasi: Exit code 0, 0 error.*

2. **Vite Production Bundling**:
   ```bash
   npm run build
   ```
   *Ekspektasi: Exit code 0, aset ter-bundle di folder `dist/`.*

3. **Smoke Test Production**:
   * Pengujian pembukaan halaman publik (`/login`, `/register`).
   * Pengujian login Email/Password dan Google Auth.
   * Pengujian Protected Routes (`/dashboard`, `/transactions`, `/accounts`, dll).
   * Pengujian pembuatan transaksi, rekening, anggaran, dan target impian.
   * Pengujian browser refresh pada SPA route.

---

## 2. Checklist Pengujian Manual Fitur Utama

- [x] Register akun Email/Password baru.
- [x] Login Email/Password.
- [x] Login Google Sign-In (Popup & Session persistence).
- [x] Tambah Rekening (Cash, Bank, E-Wallet).
- [x] Tambah Transaksi Pemasukan (Saldo rekening bertambah).
- [x] Tambah Transaksi Pengeluaran (Saldo rekening berkurang).
- [x] Transfer Antar Rekening (Rekening asal berkurang, rekening tujuan bertambah).
- [x] Pengeluaran Bersama (Shared Expense) & Pembagian Porsi.
- [x] Pelunasan Utang (Settlement) antar Pasangan.
- [x] Filter Laporan & Grafik Kas.
- [x] Refresh Browser pada route publik & protected.
- [x] Responsive layout pada Viewport Mobile (375px) & Desktop (1440px).
