import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Wallet, PieChart, Target, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  group?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} />, group: 'Utama' },
  { label: 'Transaksi', path: ROUTES.TRANSACTIONS, icon: <CreditCard size={18} />, group: 'Utama' },
  { label: 'Rekening', path: ROUTES.ACCOUNTS, icon: <Wallet size={18} />, group: 'Utama' },
  { label: 'Anggaran', path: ROUTES.BUDGET, icon: <PieChart size={18} />, group: 'Keuangan' },
  { label: 'Goals', path: ROUTES.GOALS, icon: <Target size={18} />, group: 'Keuangan' },
  { label: 'Keuangan Bersama', path: ROUTES.SHARED, icon: <Users size={18} />, group: 'Keuangan' },
  { label: 'Laporan', path: ROUTES.REPORTS, icon: <BarChart3 size={18} />, group: 'Wawasan' },
  { label: 'Pengaturan', path: ROUTES.SETTINGS, icon: <Settings size={18} />, group: 'Akun' },
];

const groups = ['Utama', 'Keuangan', 'Wawasan', 'Akun'];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      success('Berhasil keluar akun');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      error('Gagal keluar akun. Silakan coba lagi.');
    }
  }

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src="/logo.png"
            alt="OurBalance Logo"
            style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
          />
          <span className="sidebar-logo-text">OurBalance</span>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          title={collapsed ? 'Buka' : 'Tutup'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {groups.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div className="sidebar-section" key={group}>
              {!collapsed && <div className="sidebar-section-label">{group}</div>}
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {(userProfile?.photoURL || user?.photoURL) ? (
            <img
              src={userProfile?.photoURL || user?.photoURL || ''}
              alt={displayName}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="sidebar-avatar" aria-hidden>{initials}</div>
          )}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ width: '100%' }}
          aria-label="Keluar akun"
          title={collapsed ? 'Keluar akun' : undefined}
        >
          <span className="sidebar-link-icon"><LogOut size={18} /></span>
          <span className="sidebar-link-label">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
