import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Gagal Memuat Data',
  message = 'Terjadi kesalahan saat mengunduh data dari server.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--danger-border, #fecdd3)',
      }}
    >
      <AlertTriangle size={36} style={{ color: 'var(--danger-500, #ef4444)', marginBottom: '0.75rem' }} />
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '360px', marginBottom: '1rem' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
