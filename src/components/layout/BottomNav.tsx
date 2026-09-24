import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, PieChart, Target, Users } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const navItems = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Transaksi', path: ROUTES.TRANSACTIONS, icon: CreditCard },
  { label: 'Anggaran', path: ROUTES.BUDGET, icon: PieChart },
  { label: 'Goals', path: ROUTES.GOALS, icon: Target },
  { label: 'Bersama', path: ROUTES.SHARED, icon: Users },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          aria-label={label}
        >
          <span className="bottom-nav-icon">
            <Icon size={20} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
