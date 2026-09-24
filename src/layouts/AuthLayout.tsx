import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-lg" aria-label="Loading..." />
      </div>
    );
  }

  // If user is already authenticated, redirect away from auth pages to dashboard
  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="auth-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 'var(--spacing-md)' }}>
      <Outlet />
    </div>
  );
}
