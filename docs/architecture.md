# Arsitektur Aplikasi — OurBalance

OurBalance menggunakan arsitektur **Feature-Based Modular Architecture** dengan React, TypeScript, Vite, dan Firebase Spark Plan.

---

## 1. Diagram Alur Data Sistem

```
[ Antarmuka Pengguna / User Interface ]
  └── React Components (Pages & Reusable Controls)
        ↓
[ Domain Custom Hooks ]
  └── useAuth, useTransactions, useAccounts, useBudgets, useGoals, useSharedExpenses, useDashboardData
        ↓
[ Service Abstraction Layer ]
  └── authService, transactionService, accountService, budgetService, goalService, sharedExpenseService, userService, categoryService
        ↓
[ Backend Infrastructure (Firebase Spark Plan) ]
  └── Firebase Authentication & Cloud Firestore Database
```

---

## 2. Struktur Direktori Utama

* `src/constants/`: Definisi route terpusat (`routes.ts`).
* `src/contexts/`: Pengelolaan global auth session (`AuthContext.tsx`) dan sistem toast (`ToastContext.tsx`).
* `src/features/`: Modul domain bisnis terisolasi (`auth`, `dashboard`, `transactions`, `accounts`, `budgets`, `goals`, `shared`, `reports`, `settings`).
* `src/components/ui/`: Reusable design system controls (`Button`, `Input`, `Select`, `Modal`, `Card`, `Table`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog`, `Pagination`, `FilterBar`, `Toast`).
* `src/components/layout/`: Navigation layout (`Sidebar.tsx`, `BottomNav.tsx`).
* `src/layouts/`: Global layout wrapper (`AppLayout.tsx`, `AuthLayout.tsx`).
* `src/lib/`: Firebase Client SDK initialization (`firebase.ts`).
* `src/types/`: Interface TypeScript Firestore models (`index.ts`).
* `src/utils/`: Helper murni seperti `format.ts` (mata uang Rp, tanggal, kalkulasi).

---

## 3. Prinsip Desain & Enkapsulasi

1. **Feature Encapsulation**: Setiap fitur memiliki `components/`, `hooks/`, `pages/`, dan `services/` sendiri.
2. **Zero Direct Firestore Call in UI**: Seluruh pemanggilan Firestore diisolasi dalam layer `services/`.
3. **Single Source of Auth Truth**: Auth session dikelola secara independen oleh `onAuthStateChanged` pada Firebase Auth.
4. **No Dummy/Mock Financial Data**: Apabila Firestore kosong, UI menampilkan `EmptyState` interaktif.
