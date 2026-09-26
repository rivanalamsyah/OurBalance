import { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'partner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider?: string;
  coupleId?: string;
  partnerId?: string;
  role?: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Couple {
  id: string;
  member1Id: string;
  member2Id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AccountType = 'cash' | 'bank' | 'e-wallet' | 'credit' | 'investment' | 'other';

export interface Account {
  id: string;
  userId: string;
  coupleId: string;
  name: string;
  type: AccountType;
  initialBalance?: number;
  balance: number;
  currency: string;
  color?: string;
  isShared: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'shared_expense';

export interface Transaction {
  id: string;
  userId: string;
  coupleId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // for transfer
  date: Timestamp;
  description: string;
  notes?: string;
  sharedExpenseId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CategoryType = 'income' | 'expense';
export type CategoryScope = 'personal' | 'shared' | 'both';

export interface Category {
  id: string;
  coupleId: string;
  name: string;
  type: CategoryType;
  scope: CategoryScope;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Budget {
  id: string;
  userId: string;
  coupleId: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  month: string; // format: 'YYYY-MM'
  spent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type GoalType = 'personal' | 'shared';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  coupleId: string;
  ownerId?: string; // for personal goals
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Timestamp;
  type: GoalType;
  status: GoalStatus;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  notes?: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export type SplitType = 'equal' | 'custom' | 'full';

export interface SharedExpenseSplit {
  userId: string;
  amount: number;
  percentage: number;
  isPaid: boolean;
}

export interface SharedExpense {
  id: string;
  coupleId: string;
  paidBy: string; // userId
  categoryId: string;
  amount: number;
  description: string;
  notes?: string;
  date: Timestamp;
  splitType: SplitType;
  splits: SharedExpenseSplit[];
  isSettled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Settlement {
  id: string;
  coupleId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  settledAt: Timestamp;
  createdAt: Timestamp;
}

export interface DashboardStats {
  totalBalance: number;
  personalBalance: number;
  partnerBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  cashFlow: number;
  budgetUsagePercentage: number;
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color?: string;
}
