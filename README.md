# OurBalance — Couple Finance Management System

Aplikasi manajemen keuangan pasangan modern yang dirancang untuk dua pengguna (pasangan) dengan transparansi finansial, anggaran bersama, target impian (goals), pencatatan rekening, laporan visual, dan sistem pelunasan utang/piutang otomatis.

---

## 🔐 Authentication System (Autentikasi & Keamanan)

OurBalance menggunakan **Firebase Authentication** sebagai satu-satunya sumber identitas utama (*Single Source of Truth*). Sistem autentikasi mendukung dua metode masuk:

1. **Email / Password** — Pendaftaran manual dengan verifikasi format email dan enkripsi standar Firebase.
2. **Google Sign-In** — Autentikasi satu klik menggunakan Google OAuth resmi via `GoogleAuthProvider` dan `signInWithPopup`.

### Features & Security Highlights

* **Unified User Profile (`users/{uid}`)**: Baik melalui Email/Password maupun Google Sign-In, profile pengguna dibuat secara otomatis di Cloud Firestore saat login pertama kali menggunakan Firebase Auth `uid` sebagai dokumen ID. Data yang disimpan meliputi `uid`, `email`, `displayName`, `photoURL`, `provider`, `createdAt`, dan `updatedAt`.
* **Zero Duplicate Accounts**: Identitas pengguna diikat penuh pada Firebase Auth `uid`. Sistem mencegah pembentukan akun ganda.
* **Non-Destructive Profile Merging**: Jika profil Firestore pengguna sudah ada saat login Google, sistem mempertahankan data sensitif pengguna (seperti `coupleId`, `partnerId`, dan histori keuangan) dan hanya memperbarui timestamp `updatedAt`.
* **Credential Protection**: Aplikasi tidak pernah menyimpan OAuth access token atau password Google di `localStorage` maupun Firestore.
* **Friendly Indonesian Error Handling**: Penanganan error lengkap untuk `auth/popup-closed-by-user`, `auth/popup-blocked`, `auth/account-exists-with-different-credential`, `auth/unauthorized-domain`, `auth/operation-not-allowed`, dan `auth/network-request-failed`.
* **Auth State Listener**: Session dikelola secara real-time via `onAuthStateChanged` di `AuthContext`, memastikan login tetap aktif setelah browser refresh dan Protected Routes bekerja sempurna.

---

## 🛠️ Konfigurasi Google Authentication di Firebase Console

Untuk mengaktifkan login Google pada environment development maupun production:

### 1. Mengaktifkan Sign-In Provider Google
1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih project **OurBalance**.
2. Masuk ke menu **Build** > **Authentication** > tab **Sign-in method**.
3. Klik pada provider **Google**.
4. Aktifkan saklar **Enable**.
5. Pilih **Project support email** yang valid.
6. Simpan konfigurasi.

### 2. Mengkonfigurasi Authorized Domains
Agar Google OAuth Popup tidak diblokir atau menghasilkan error `auth/unauthorized-domain`:
1. Masuk ke **Authentication** > tab **Settings** > **Authorized domains**.
2. Pastikan domain berikut terdaftar:
   * `localhost` (untuk pengembangan lokal)
   * `ourbalance.web.app` (domain production utama)
   * `ourbalance.firebaseapp.com` (domain fallback Firebase)

---

## 🏗️ Firestore Security Rules

Firestore Security Rules diatur secara ketat tanpa membedakan metode login pengguna (Email/Password maupun Google). Selama `request.auth.uid` valid:
* Pengguna hanya dapat membaca & menulis data pribadi mereka.
* Data pasangan (`couples`, `accounts`, `transactions`, `budgets`, `goals`, `sharedExpenses`) hanya dapat diakses oleh pengguna yang terverifikasi sebagai anggota couple (`isMember(coupleId)`).
* `uid` dan `email` bersifat immutable setelah profil dibuat.

---

## 🚀 Memulai & Pengoperasian Lokal

### Prasyarat
* Node.js (v18+)
* npm / pnpm / yarn

### Langkah Installasi
```bash
# 1. Clone repository
git clone https://github.com/your-repo/ourbalance.git
cd OurBalance

# 2. Install dependensi
npm install

# 3. Konfigurasi Environment Variable (.env)
cp .env.example .env
```

Isi file `.env` sesuai dengan konfigurasi project Firebase:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=ourbalance.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ourbalance
VITE_FIREBASE_STORAGE_BUCKET=ourbalance.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Jalankan Development Server
```bash
npm run dev
```

### Type Check & Build Production
```bash
npm run tsc
npm run build
```

---

## 🚨 Troubleshooting Google Authentication

| Masalah / Error | Penyebab | Solusi |
|---|---|---|
| `auth/popup-closed-by-user` | Pengguna menutup popup Google sebelum login selesai. | Coba lagi dan selesaikan login di popup. |
| `auth/popup-blocked` | Browser memblokir popup window. | Klik ikon blokir popup di URL bar browser lalu pilih "Allow popups for this site". |
| `auth/unauthorized-domain` | Domain belum terdaftar di Firebase. | Tambahkan domain aktif ke Firebase Console > Authentication > Settings > Authorized Domains. |
| `auth/account-exists-with-different-credential` | Email sudah terdaftar via Email/Password. | Masuk menggunakan form Email/Password terlebih dahulu. |
| `auth/operation-not-allowed` | Provider Google belum diaktifkan. | Aktifkan provider Google di Firebase Console. |

---

## 📄 Lisensi
Hak Cipta © 2026 OurBalance. All rights reserved.
