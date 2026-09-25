import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { TopBar } from '../components/layout/TopBar';

export function AppLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top and close mobile menu on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="app-layout">
      <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
      <BottomNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}
