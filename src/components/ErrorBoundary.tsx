import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Terjadi Kesalahan Aplikasi</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Maaf, aplikasi mengalami masalah yang tidak terduga. Silakan coba muat ulang halaman.
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" onClick={this.handleReset} fullWidth>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
