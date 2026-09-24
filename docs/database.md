# Model Data & Database — Cloud Firestore

OurBalance menggunakan Google Cloud Firestore (Spark Plan) sebagai database NoSQL utama. Seluruh dokumen diisolasi berdasarkan identitas pengguna (`uid`) dan identitas pasangan (`coupleId`).

---

## 1. Schema Koleksi Firestore

### Koleksi `users/{uid}`
* `uid` (string, primary key): Firebase Auth User ID.
* `email` (string): Alamat email akun.
* `displayName` (string): Nama lengkap pengguna.
* `photoURL` (string, opsional): URL avatar pengguna (Google Auth / Profile).
* `provider` (string, opsional): Provider autentikasi (`password` atau `google.com`).
* `coupleId` (string, opsional): ID dokumen di koleksi `couples`.
* `partnerId` (string, opsional): UID akun pasangan.
* `createdAt` (Timestamp): Waktu akun dibuat.
* `updatedAt` (Timestamp): Waktu akun diperbarui.

### Koleksi `couples/{coupleId}`
* `id` (string): ID unik pasangan.
* `member1Id` (string): UID pembuat couple.
* `member2Id` (string): UID pasangan yang terhubung.
* `createdAt` (Timestamp): Tanggal couple dibuat.
* `updatedAt` (Timestamp): Waktu perbaruan terakhir.

### Koleksi `accounts/{accountId}`
* `id` (string): ID unik rekening.
* `userId` (string): UID pemilik rekening.
* `coupleId` (string): ID couple terkait.
* `name` (string): Nama rekening (misal: BCA Utama, Mandiri, Dompet).
* `type` (string): `cash` | `bank` | `e-wallet` | `credit` | `investment` | `other`.
* `balance` (number): Saldo terkini dalam Rupiah.
* `currency` (string): `IDR`.
* `isShared` (boolean): Menandakan rekening bersama atau pribadi.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `categories/{categoryId}`
* `id` (string): ID unik kategori.
* `coupleId` (string): ID couple.
* `name` (string): Nama kategori (misal: Makanan & Minuman, Gaji, Listrik).
* `type` (string): `income` | `expense`.
* `scope` (string): `personal` | `shared` | `both`.
* `isDefault` (boolean): Indikator kategori bawaan sistem.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `transactions/{transactionId}`
* `id` (string): ID unik transaksi.
* `userId` (string): UID pencatat.
* `coupleId` (string): ID couple.
* `type` (string): `income` | `expense` | `transfer` | `shared_expense`.
* `amount` (number): Nominal transaksi (> 0).
* `categoryId` (string): ID kategori.
* `accountId` (string): ID rekening utama (sumber/tujuan).
* `toAccountId` (string, opsional): ID rekening tujuan (khusus `transfer`).
* `date` (Timestamp): Tanggal transaksi.
* `description` (string): Deskripsi transaksi.
* `notes` (string, opsional): Catatan tambahan.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `budgets/{budgetId}`
* `id` (string): ID unik anggaran.
* `userId` (string): UID pembuat.
* `coupleId` (string): ID couple.
* `categoryId` (string): ID kategori yang dianggarkan.
* `amount` (number): Limit anggaran (> 0).
* `month` (string): Periode bulan dalam format `YYYY-MM`.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `goals/{goalId}`
* `id` (string): ID unik target keuangan.
* `coupleId` (string): ID couple.
* `ownerId` (string, opsional): UID pemilik jika personal goal.
* `name` (string): Nama target impian.
* `targetAmount` (number): Target nominal (> 0).
* `currentAmount` (number): Jumlah terkumpul saat ini.
* `type` (string): `personal` | `shared`.
* `status` (string): `active` | `completed` | `paused`.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `sharedExpenses/{expenseId}`
* `id` (string): ID pengeluaran bersama.
* `coupleId` (string): ID couple.
* `paidBy` (string): UID pembayar.
* `amount` (number): Total nominal pengeluaran bersama.
* `description` (string): Keterangan pengeluaran.
* `splitType` (string): `equal` | `custom` | `full`.
* `splits` (array): Rincian porsi pembagian tiap member (`userId`, `amount`, `percentage`, `isPaid`).
* `isSettled` (boolean): Status kelunasan.
* `createdAt` & `updatedAt` (Timestamp).

### Koleksi `settlements/{settlementId}`
* `id` (string): ID bukti pelunasan.
* `coupleId` (string): ID couple.
* `fromUserId` (string): UID pembayar utang.
* `toUserId` (string): UID penerima pelunasan.
* `amount` (number): Nominal yang dilunasi.
* `settledAt` (Timestamp): Tanggal pelunasan.
* `createdAt` (Timestamp).

---

## 2. Firestore Indexes (`firestore.indexes.json`)

Index komposit yang telah terkonfigurasi untuk mendukung query real-time:
* `transactions`: `coupleId` ASC, `date` DESC
* `transactions`: `coupleId` ASC, `categoryId` ASC, `date` DESC
* `budgets`: `coupleId` ASC, `month` ASC
* `goals`: `coupleId` ASC, `status` ASC
* `sharedExpenses`: `coupleId` ASC, `isSettled` ASC
