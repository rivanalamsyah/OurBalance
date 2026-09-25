import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const photoURL = userProfile?.photoURL || user?.photoURL;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="topbar" aria-label="Header seluler">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-brand" onClick={() => navigate(ROUTES.DASHBOARD)} role="button" tabIndex={0}>
          <img src="/logo.png" alt="OurBalance Logo" className="topbar-logo" />
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-user-btn"
          onClick={() => navigate(ROUTES.SETTINGS_PROFILE)}
          aria-label="Profil pengguna"
          title={displayName}
        >
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="topbar-avatar-img" />
          ) : (
            <div className="topbar-avatar-initials">{initials}</div>
          )}
        </button>
      </div>
    </header>
  );
}
