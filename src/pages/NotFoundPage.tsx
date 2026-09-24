import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Halaman Tidak Ditemukan
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
        Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button variant="primary">Kembali ke Dashboard</Button>
      </Link>
    </div>
  );
}
