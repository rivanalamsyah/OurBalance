import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { TransactionsPage } from './features/transactions/pages/TransactionsPage';
import { AccountsPage } from './features/accounts/pages/AccountsPage';
import { BudgetPage } from './features/budgets/pages/BudgetPage';
import { GoalsPage } from './features/goals/pages/GoalsPage';
import { SharedPage } from './features/shared/pages/SharedPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { ROUTES } from './constants/routes';

import './index.css';
import './components.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public authentication routes */}
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<LoginPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<LoginPage />} />
              </Route>

              {/* Public 404 route */}
              <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

              {/* Protected application routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

                  {/* Transactions */}
                  <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
                  <Route path={ROUTES.TRANSACTIONS_NEW} element={<TransactionsPage />} />
                  <Route path={ROUTES.TRANSACTION_DETAIL()} element={<TransactionsPage />} />
                  <Route path={ROUTES.TRANSACTION_EDIT()} element={<TransactionsPage />} />

                  {/* Accounts */}
                  <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
                  <Route path={ROUTES.ACCOUNTS_NEW} element={<AccountsPage />} />
                  <Route path={ROUTES.ACCOUNT_DETAIL()} element={<AccountsPage />} />
                  <Route path={ROUTES.ACCOUNT_EDIT()} element={<AccountsPage />} />

                  {/* Budget */}
                  <Route path={ROUTES.BUDGET} element={<BudgetPage />} />
                  <Route path={ROUTES.BUDGET_NEW} element={<BudgetPage />} />
                  <Route path={ROUTES.BUDGET_EDIT()} element={<BudgetPage />} />

                  {/* Goals */}
                  <Route path={ROUTES.GOALS} element={<GoalsPage />} />
                  <Route path={ROUTES.GOALS_NEW} element={<GoalsPage />} />
                  <Route path={ROUTES.GOAL_DETAIL()} element={<GoalsPage />} />
                  <Route path={ROUTES.GOAL_EDIT()} element={<GoalsPage />} />

                  {/* Shared Finances */}
                  <Route path={ROUTES.SHARED} element={<SharedPage />} />
                  <Route path={ROUTES.SHARED_EXPENSES} element={<SharedPage />} />
                  <Route path={ROUTES.SHARED_EXPENSES_NEW} element={<SharedPage />} />
                  <Route path={ROUTES.SHARED_SETTLEMENTS} element={<SharedPage />} />

                  {/* Reports */}
                  <Route path={ROUTES.REPORTS} element={<ReportsPage />} />

                  {/* Settings */}
                  <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                  <Route path={ROUTES.SETTINGS_PROFILE} element={<SettingsPage />} />
                  <Route path={ROUTES.SETTINGS_COUPLE} element={<SettingsPage />} />
                  <Route path={ROUTES.SETTINGS_CATEGORIES} element={<SettingsPage />} />
                  <Route path={ROUTES.SETTINGS_ACCOUNTS} element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Default redirects */}
              <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
            </Routes>
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
