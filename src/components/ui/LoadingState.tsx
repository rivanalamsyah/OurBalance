import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export function LoadingState({ message = 'Memuat data...', height = '200px' }: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        gap: '0.75rem',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2 size={28} className="btn-spinner" style={{ color: 'var(--primary-600)' }} />
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
    </div>
  );
}
