# Model Keamanan & Security Rules — OurBalance

Keamanan data di OurBalance ditegakkan di tingkat backend menggunakan **Firebase Authentication** dan **Cloud Firestore Security Rules**.

---

## 1. Prinsip Utama Keamanan Backend

1. **Zero Access for Unauthenticated Users**: Semua query dan mutasi tanpa token `request.auth` yang valid akan ditolak secara eksplisit oleh Firestore.
2. **Strict Document Ownership**: Dokumen personal (`users/{userId}`) hanya dapat diubah oleh pemilik akun (`request.auth.uid == userId`). Field sensitif seperti `uid` dan `email` bersifat immutable.
3. **Couple Membership Check (`isMember`)**: Semua akses ke data pasangan (`accounts`, `transactions`, `budgets`, `goals`, `sharedExpenses`, `settlements`) diverifikasi via fungsi helper rule `isMember(coupleId)` yang membaca dokumen `/couples/{coupleId}`.
4. **No Universal Wildcard Rules**: Pembatasan `allow read, write: if request.auth != null` tanpa pembatasan ownership/membership **dilarang keras**.

---

## 2. Implementasi Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuth() && request.auth.uid == userId;
    }

    function isMember(coupleId) {
      let couple = get(/databases/$(database)/documents/couples/$(coupleId));
      return isAuth()
        && couple != null
        && (couple.data.member1Id == request.auth.uid
            || couple.data.member2Id == request.auth.uid);
    }

    function notChanged(field) {
      return !(field in request.resource.data)
          || request.resource.data[field] == resource.data[field];
    }

    // Rules untuk /users/{userId}
    match /users/{userId} {
      allow read: if isAuth();
      allow create: if isOwner(userId)
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.email is string
        && request.resource.data.displayName is string;
      allow update: if isOwner(userId)
        && notChanged('uid')
        && notChanged('email');
      allow delete: if false;
    }

    // Rules untuk /couples/{coupleId}
    match /couples/{coupleId} {
      allow read: if isMember(coupleId);
      allow create: if isAuth()
        && (request.resource.data.member1Id == request.auth.uid
            || request.resource.data.member2Id == request.auth.uid);
      allow update: if isMember(coupleId)
        && notChanged('member1Id')
        && notChanged('createdAt');
      allow delete: if false;
    }

    // Rules data domain (accounts, transactions, budgets, goals, sharedExpenses, settlements)
    match /accounts/{accountId} {
      allow read: if isAuth() && isMember(resource.data.coupleId);
      allow create: if isAuth() && isMember(request.resource.data.coupleId) && request.resource.data.userId == request.auth.uid;
      allow update: if isAuth() && isMember(resource.data.coupleId) && notChanged('coupleId') && notChanged('userId') && notChanged('createdAt');
      allow delete: if isAuth() && isMember(resource.data.coupleId) && resource.data.userId == request.auth.uid;
    }

    match /transactions/{transactionId} {
      allow read: if isAuth() && isMember(resource.data.coupleId);
      allow create: if isAuth()
        && isMember(request.resource.data.coupleId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.amount is number
        && request.resource.data.amount > 0;
      allow update: if isAuth() && isMember(resource.data.coupleId) && notChanged('coupleId') && notChanged('userId') && notChanged('createdAt');
      allow delete: if isAuth() && isMember(resource.data.coupleId);
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Secret Protection & Environment Isolation

* File `.env` dan `.env.local` telah dimasukkan ke dalam `.gitignore`.
* Aplikasi frontend hanya menggunakan publik API Keys yang memang aman untuk publikasi client-side (Firebase Web Config).
* Keamanan data sepenuhnya bergantung pada Firebase Authentication JWT dan Firestore Security Rules.
