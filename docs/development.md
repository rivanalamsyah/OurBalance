# Panduan Pengembangan Lokal — OurBalance

Panduan pengembang untuk menjalankan, menguji, dan berkontribusi pada codebase OurBalance.

---

## 1. Setup Lingkungan Lokal

```bash
# Clone repository
git clone https://github.com/rivanalamsyah/OurBalance.git
cd OurBalance

# Install dependencies
npm install

# Buat file .env dari template
cp .env.example .env
```

---

## 2. Command Utama

* **Menjalankan Dev Server**: `npm run dev`
* **Menjalankan Type Check**: `npm run tsc`
* **Menjalankan Production Build**: `npm run build`
* **Preview Build Output**: `npm run preview`
* **Deploy ke Hosting**: `firebase deploy --only hosting`

---

## 3. Standar Penulisan Kode

1. Gunakan nama komponen PascalCase (misal: `FinancialSummaryCard.tsx`).
2. Gunakan nama service camelCase (misal: `transactionService.ts`).
3. Selalu tambahkan tipe data eksplisit pada TypeScript interfaces. Jangan gunakan `any`.
4. Hindari inline style berlebih; gunakan variabel CSS murni di `index.css` atau `components.css`.
