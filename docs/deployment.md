# Prosedur Deployment & Production Setup — Firebase Hosting

Dokumentasi ini menjelaskan langkah-langkah deployment aplikasi OurBalance ke platform **Firebase Hosting** pada target domain `https://ourbalance.web.app`.

---

## 1. Prasyarat Deployment

1. Firebase CLI sudah terinstall (`npm install -g firebase-tools`).
2. Login ke akun Firebase via terminal (`firebase login`).
3. Konfigurasi `firebase.json` dan `.firebaserc` mengarah ke project ID `ourbalance`.

---

## 2. Konfigurasi `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## 3. Langkah Deployment

```bash
# 1. Jalankan Type Check
npm run tsc

# 2. Jalankan Production Build
npm run build

# 3. Deploy Hosting ke Firebase
firebase deploy --only hosting

# 4. Deploy Firestore Rules & Indexes (jika ada perubahan)
firebase deploy --only firestore
```

---

## 4. Prosedur Rollback

Jika ditemukan isu pasca-deployment:
1. Buka [Firebase Console Hosting Panel](https://console.firebase.google.com/project/ourbalance/hosting/sites/ourbalance).
2. Temukan rilis stabil sebelumnya pada **Release History**.
3. Klik titik tiga pada rilis tersebut lalu pilih **Rollback**.
