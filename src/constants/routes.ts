export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',

  TRANSACTIONS: '/transactions',
  TRANSACTIONS_NEW: '/transactions/new',
  TRANSACTION_DETAIL: (id: string = ':transactionId') => `/transactions/${id}`,
  TRANSACTION_EDIT: (id: string = ':transactionId') => `/transactions/${id}/edit`,

  ACCOUNTS: '/accounts',
  ACCOUNTS_NEW: '/accounts/new',
  ACCOUNT_DETAIL: (id: string = ':accountId') => `/accounts/${id}`,
  ACCOUNT_EDIT: (id: string = ':accountId') => `/accounts/${id}/edit`,

  BUDGET: '/budget',
  BUDGET_NEW: '/budget/new',
  BUDGET_EDIT: (id: string = ':budgetId') => `/budget/${id}/edit`,

  GOALS: '/goals',
  GOALS_NEW: '/goals/new',
  GOAL_DETAIL: (id: string = ':goalId') => `/goals/${id}`,
  GOAL_EDIT: (id: string = ':goalId') => `/goals/${id}/edit`,

  SHARED: '/shared',
  SHARED_EXPENSES: '/shared/expenses',
  SHARED_EXPENSES_NEW: '/shared/expenses/new',
  SHARED_SETTLEMENTS: '/shared/settlements',

  REPORTS: '/reports',

  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_COUPLE: '/settings/couple',
  SETTINGS_CATEGORIES: '/settings/categories',
  SETTINGS_ACCOUNTS: '/settings/accounts',

  NOT_FOUND: '/404',
} as const;
