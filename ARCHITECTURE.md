# Architectural Specification & Engineering Standard — OurBalance

OurBalance is a modern, scalable, feature-based Couple Finance Management System built with **React**, **TypeScript**, **Vite**, and **Firebase Spark Plan (Cloud Firestore & Firebase Authentication)**.

---

## 1. High-Level System Architecture

```
[ User Interaction Layer ]
  └── Pages & Layouts (AppLayout / AuthLayout)
        ↓
[ Feature Component Layer ]
  └── Feature-specific UI & Reusable Design System Controls (Card, Button, Input, Modal, Table, etc.)
        ↓
[ Domain State & Business Logic Layer ]
  └── Custom Hooks (useAuth, useTransactions, useAccounts, useBudgets, useGoals, useSharedExpenses, useDashboardData)
        ↓
[ Service / Repository Abstraction Layer ]
  └── Typed Service Functions (authService, transactionService, accountService, budgetService, goalService, etc.)
        ↓
[ Cloud Infrastructure Layer ]
  └── Firebase Authentication & Cloud Firestore (Spark Plan)
```

---

## 2. Directory Structure & Layer Responsibilities

```
src/
├── constants/
│   └── routes.ts              # Centralized route definitions & path generators
├── contexts/
│   ├── AuthContext.tsx        # Application-wide authentication context & user profile state
│   └── ToastContext.tsx       # Toast notification system
├── features/                  # Domain-driven feature modules
│   ├── auth/
│   │   ├── pages/             # LoginPage.tsx (handles login, register, reset modes)
│   │   └── services/          # authService.ts (Firebase Auth wrapper)
│   ├── dashboard/
│   │   ├── components/        # TransactionRow.tsx, FinancialSummaryCard.tsx
│   │   ├── hooks/             # useDashboardData.ts (KPIs, cash flow, category calculation)
│   │   └── pages/             # DashboardPage.tsx
│   ├── transactions/
│   │   ├── hooks/             # useTransactions.ts
│   │   ├── pages/             # TransactionsPage.tsx
│   │   └── services/          # transactionService.ts
│   ├── accounts/
│   │   ├── hooks/             # useAccounts.ts
│   │   ├── pages/             # AccountsPage.tsx
│   │   └── services/          # accountService.ts
│   ├── budgets/
│   │   ├── hooks/             # useBudgets.ts
│   │   ├── pages/             # BudgetPage.tsx
│   │   └── services/          # budgetService.ts
│   ├── goals/
│   │   ├── hooks/             # useGoals.ts
│   │   ├── pages/             # GoalsPage.tsx
│   │   └── services/          # goalService.ts
│   ├── shared/
│   │   ├── hooks/             # useSharedExpenses.ts
│   │   ├── pages/             # SharedPage.tsx
│   │   └── services/          # sharedExpenseService.ts
│   ├── reports/
│   │   └── pages/             # ReportsPage.tsx
│   └── settings/
│       ├── hooks/             # useCategories.ts, useCouple.ts
│       ├── pages/             # SettingsPage.tsx
│       └── services/          # categoryService.ts, userService.ts
├── components/                # Reusable global design system UI components
│   ├── ui/                    # Button, Input, Select, Modal, Card, Table, EmptyState, LoadingState, ErrorState, ConfirmDialog, Pagination, FilterBar, Toast
│   ├── layout/                # Sidebar.tsx, BottomNav.tsx
│   └── ErrorBoundary.tsx      # Application error boundary handler
├── layouts/                   # Global layout containers
│   ├── AppLayout.tsx          # Main application layout (Sidebar + Main + BottomNav)
│   └── AuthLayout.tsx         # Authentication layout container
├── lib/
│   ├── firebase.ts            # Centralized Firebase initialization & SDK exports
│   └── tokens.ts              # Design token constants
├── types/
│   └── index.ts               # Strongly-typed TypeScript interfaces for Firestore models
├── utils/
│   └── format.ts              # Pure helper functions (currency formatting, date helpers, math)
├── pages/
│   └── NotFoundPage.tsx       # Professional 404 page
├── App.tsx                    # React Router configuration & route guards
├── main.tsx                   # Application entry point
└── index.css                  # Core CSS variables & base design tokens
```

---

## 3. Strict Architectural Principles

1. **Separation of Concerns:**
   - **Pages:** Orchestrate page composition and handle route parameters.
   - **Components:** Pure UI components rendering props. Business logic is strictly extracted into custom hooks.
   - **Hooks:** Reusable state, data fetching, and calculation logic.
   - **Services:** Pure async repository functions performing Cloud Firestore queries and writes. Zero JSX in service layer.
   - **Types:** Strictly typed TypeScript interfaces. Usage of `any`, `@ts-ignore`, or `@ts-nocheck` is forbidden.

2. **Data Truth & Zero Hardcoded Financial Data:**
   - All financial numbers (balances, income, expense, goals, budgets) originate dynamically from Cloud Firestore.
   - If Firestore is empty, components render professional **EmptyState** views with CTA buttons to create initial records.
   - Fallback mock objects, hardcoded sample balances (e.g. `Rp 5.000.000`), or fake chart datasets are strictly prohibited in production code.

3. **Centralized Firestore Access:**
   - Components MUST NOT invoke `collection()`, `doc()`, `getDocs()`, or `onSnapshot()` directly.
   - All database access MUST route through feature service files (e.g. `transactionService.ts`, `accountService.ts`).

4. **Security & Data Isolation:**
   - Every Firestore document includes `coupleId` and `userId` or `ownerId`.
   - Security Rules strictly enforce that users can only read/write documents belonging to their validated `coupleId`.

---

## 4. How to Add a New Feature or Collection

1. **Define TypeScript Interface:** Add model definition to `src/types/index.ts`.
2. **Create Feature Directory:** `src/features/<feature-name>/` with subfolders `services/`, `hooks/`, `components/`, and `pages/`.
3. **Create Typed Service:** Implement CRUD functions using Firestore helpers in `src/features/<feature-name>/services/<feature>Service.ts`.
4. **Create Custom Hook:** Implement realtime subscription or fetching hook in `src/features/<feature-name>/hooks/use<Feature>.ts`.
5. **Add Routes:** Register semantic routes in `src/constants/routes.ts` and add route entries to `src/App.tsx`.
6. **Integrate UI:** Build clean components using reusable UI controls from `src/components/ui/`.

---

## 5. Routing Architecture & Production SPA Deployment

- Domain: `https://ourbalance.web.app`
- Public Routes: `/login`, `/register`, `/forgot-password`, `/404`
- Protected Routes: `/dashboard`, `/transactions`, `/accounts`, `/budget`, `/goals`, `/shared`, `/reports`, `/settings`
- Firebase Hosting SPA Rewrite (`firebase.json`):
  ```json
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
  ```
