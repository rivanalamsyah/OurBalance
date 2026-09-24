# OurBalance — Firebase Setup Guide

Complete guide to configure Firebase for the OurBalance Couple Finance Management System.
Uses **Firebase Spark Plan (free tier)** — no paid services required.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Console Setup](#1-firebase-console-setup)
3. [Enable Authentication](#2-enable-authentication)
4. [Create Firestore Database](#3-create-firestore-database)
5. [Configure Environment Variables](#4-configure-environment-variables)
6. [Deploy Firestore Rules & Indexes](#5-deploy-firestore-rules--indexes)
7. [Run the App Locally](#6-run-the-app-locally)
8. [Data Model Reference](#7-data-model-reference)
9. [Couple System Explained](#8-couple-system-explained)
10. [Security Model](#9-security-model)
11. [Troubleshooting](#10-troubleshooting)

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- A Google account
- Firebase CLI (optional): `npm install -g firebase-tools`

---

## 1. Firebase Console Setup

1. Go to https://console.firebase.google.com
2. Click **Add project** -> name it `ourbalance`
3. (Optional) Disable Google Analytics
4. Click **Create project**

---

## 2. Enable Authentication

1. Sidebar -> **Build -> Authentication**
2. Click **Get started**
3. Select **Email/Password** -> **Enable** -> Save

---

## 3. Create Firestore Database

1. Sidebar -> **Build -> Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select region (e.g. `asia-southeast1` for Indonesia)
5. Click **Enable**

Spark Plan limits: 1 GiB storage, 50K reads/day, 20K writes/day.

---

## 4. Configure Environment Variables

### Step 1 — Get Firebase config

1. Firebase Console -> **Project Settings** (gear icon)
2. Scroll to **Your apps** -> click Web icon
3. Register app with nickname `OurBalance Web`
4. Copy the `firebaseConfig` values

### Step 2 — Create `.env.local`

```
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
```

NEVER commit `.env.local` to Git — it is already in `.gitignore`.

---

## 5. Deploy Firestore Rules & Indexes

### Option A — Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use ourbalance
firebase deploy --only firestore
```

### Option B — Firebase Console (Manual)

**Rules:**
1. Firestore -> Rules tab
2. Paste contents of `firestore.rules`
3. Click **Publish**

**Indexes:**
1. Firestore -> Indexes tab
2. Add each composite index from `firestore.indexes.json`
   OR: run the app and click the auto-generated index link in browser console

---

## 6. Run the App Locally

```bash
npm install
npm run dev
# Open: http://localhost:5173
```

App redirects to `/login` — create your account there.

---

## 7. Data Model Reference

### users
```
uid: string (doc ID = Firebase Auth UID)
email: string
displayName: string
photoURL?: string
coupleId?: string
partnerId?: string
createdAt: Timestamp
updatedAt: Timestamp
```

### couples
```
member1Id: string
member2Id: string | null
createdAt: Timestamp
updatedAt: Timestamp
```

### accounts
```
userId: string (owner)
coupleId: string
name: string
type: cash | bank | e-wallet | credit | investment | other
balance: number
currency: string (IDR)
isShared: boolean
createdAt: Timestamp
updatedAt: Timestamp
```

### categories
```
coupleId: string
name: string
type: income | expense
scope: personal | shared | both
isDefault: boolean
createdAt: Timestamp
updatedAt: Timestamp
```

### transactions
```
userId: string (creator)
coupleId: string
type: income | expense | transfer | shared_expense
amount: number (always positive)
categoryId: string
accountId: string
toAccountId?: string (transfer)
date: Timestamp
description: string
notes?: string
createdAt: Timestamp
updatedAt: Timestamp
```

### budgets
```
userId: string
coupleId: string
categoryId: string
amount: number (budget limit)
period: monthly
month: string (YYYY-MM)
spent: number (calculated)
createdAt: Timestamp
updatedAt: Timestamp
```

### goals
```
coupleId: string
ownerId?: string (personal goals)
name: string
description?: string
targetAmount: number
currentAmount: number
deadline?: Timestamp
type: personal | shared
status: active | completed | paused
createdAt: Timestamp
updatedAt: Timestamp
```

### goalContributions
```
goalId: string
userId: string
amount: number
notes?: string
date: Timestamp
createdAt: Timestamp
```

### sharedExpenses
```
coupleId: string
paidBy: string (userId)
categoryId: string
amount: number
description: string
date: Timestamp
splitType: equal | custom | full
splits: [{userId, amount, percentage, isPaid}]
isSettled: boolean
createdAt: Timestamp
updatedAt: Timestamp
```

### settlements
```
coupleId: string
fromUserId: string
toUserId: string
amount: number
description?: string
settledAt: Timestamp
createdAt: Timestamp
```

---

## 8. Couple System Explained

User A and User B each have a `coupleId` in their profile pointing to the same `/couples/{coupleId}` document.

- Personal data: has `userId` + `coupleId` (accounts, transactions, budgets)
- Shared data: has only `coupleId` (sharedExpenses, settlements, shared goals)

**How linking works:**
1. User A registers -> solo couple auto-created
2. User A: Settings -> Partner -> enter User B email
3. Both profiles updated with same `coupleId` + `partnerId`

---

## 9. Security Model

Collection      | Unauth | Own user | Couple member | Other
----------------|--------|----------|---------------|-------
users           | No     | R/W      | Read only     | No
couples         | No     | Yes      | Yes           | No
accounts        | No     | Yes      | Yes           | No
transactions    | No     | Create   | R/U/D         | No
budgets         | No     | Yes      | Read          | No
goals           | No     | No       | Yes           | No
sharedExpenses  | No     | No       | Yes           | No
settlements     | No     | No       | R/Create      | No

Immutable fields enforced by security rules:
- uid, email (users)
- member1Id (couples)
- coupleId, userId (accounts, transactions, budgets)
- paidBy (sharedExpenses)
- All fields (settlements - no updates/deletes allowed)

---

## 10. Troubleshooting

**"Missing or insufficient permissions"**
- Deploy firestore.rules to Firebase Console
- Ensure user coupleId is set correctly

**Index errors in console**
- Click the auto-generated URL in the error to create index instantly

**Firebase initialization error**
- Check all VITE_FIREBASE_* variables are set in .env.local

**Categories not showing**
- Seeded automatically on first couple creation
- Add manually via Settings -> Categories

---

## Available Scripts

```
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Firebase CLI

```
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only firestore
firebase deploy --only hosting
```
