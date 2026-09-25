import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getAuthErrorMessage } from '../services/authService';
import { ROUTES } from '../../../constants/routes';

type Mode = 'login' | 'register' | 'reset';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export function LoginPage() {
  const { user, loading: authLoading, login, loginWithGoogle, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();

  const [mode, setMode] = useState<Mode>(location.pathname === ROUTES.REGISTER ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
    form?: string;
  }>({});

  const from = (location.state as LocationState)?.from?.pathname || ROUTES.DASHBOARD;

  useEffect(() => {
    if (location.pathname === ROUTES.REGISTER) {
      setMode('register');
    } else if (location.pathname === ROUTES.LOGIN) {
      setMode('login');
    }
  }, [location.pathname]);

  useEffect(() => {
    document.title = mode === 'login' ? 'Sign In | OurBalance' : mode === 'register' ? 'Register | OurBalance' : 'Reset Password | OurBalance';
  }, [mode]);

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  function validate(): boolean {
    const errs: typeof errors = {};

    if (!email.trim()) {
      errs.email = 'Alamat email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Format email tidak valid';
    }

    if (mode !== 'reset') {
      if (!password) {
        errs.password = 'Password wajib diisi';
      } else if (password.length < 6) {
        errs.password = 'Password minimal 6 karakter';
      }
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        errs.displayName = 'Nama pengguna wajib diisi';
      } else if (displayName.trim().length < 2) {
        errs.displayName = 'Nama minimal 2 karakter';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        success('Selamat datang kembali!');
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        await register(email.trim(), password, displayName.trim());
        success('Akun berhasil dibuat! Selamat datang di OurBalance.');
        navigate(from, { replace: true });
      } else {
        await resetPassword(email.trim());
        success('Email reset password telah dikirim. Periksa inbox Anda.');
        setMode('login');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setErrors({ form: getAuthErrorMessage(code) });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrors({});

    try {
      await loginWithGoogle();
      success('Berhasil masuk dengan akun Google!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setErrors({ form: getAuthErrorMessage(code) });
    } finally {
      setGoogleLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Selamat datang kembali',
    register: 'Buat akun OurBalance',
    reset: 'Reset password',
  };

  const subtitles: Record<Mode, string> = {
    login: 'Masuk untuk mengelola keuangan pasangan bersama',
    register: 'Mulai perjalanan finansial transparan Anda',
    reset: 'Kami akan mengirimkan link reset ke email Anda',
  };

  const buttonLabels: Record<Mode, string> = {
    login: 'Masuk',
    register: 'Daftar Sekarang',
    reset: 'Kirim Link Reset',
  };

  const isProcessing = loading || googleLoading;

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        <div className="login-logo">
          <img
            src="/logo.png"
            alt="OurBalance Logo"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
        </div>

        <h1 className="login-title">{titles[mode]}</h1>
        <p className="login-subtitle">{subtitles[mode]}</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-label="Form autentikasi">
          {errors.form && (
            <div className="login-error" role="alert" aria-live="polite">
              {errors.form}
            </div>
          )}

          {mode === 'register' && (
            <Input
              id="auth-displayname"
              type="text"
              label="Nama Lengkap"
              placeholder="Contoh: Budi Prasetyo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              leftIcon={<User size={16} />}
              autoComplete="name"
              autoFocus={mode === 'register'}
              required
              disabled={isProcessing}
            />
          )}

          <Input
            id="auth-email"
            type="email"
            label="Alamat Email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail size={16} />}
            autoComplete="email"
            autoFocus={mode === 'login'}
            required
            disabled={isProcessing}
          />

          {mode !== 'reset' && (
            <Input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password Anda'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px', color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  tabIndex={0}
                  disabled={isProcessing}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              disabled={isProcessing}
            />
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-4px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', padding: '2px 0' }}
                onClick={() => { setMode('reset'); setErrors({}); }}
                disabled={isProcessing}
              >
                Lupa password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={isProcessing}
            id={`auth-submit-${mode}`}
          >
            {buttonLabels[mode]}
          </Button>
        </form>

        {mode !== 'reset' && (
          <>
            <div className="auth-divider">
              <span>atau</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              loading={googleLoading}
              disabled={isProcessing}
              onClick={handleGoogleSignIn}
              className="btn-google"
              id="auth-google-btn"
            >
              {!googleLoading && <GoogleIcon />}
              Lanjutkan dengan Google
            </Button>
          </>
        )}

        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {mode === 'login' && (
            <>
              Belum memiliki akun?{' '}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-primary-600)', fontWeight: 600, padding: '0' }}
                onClick={() => { setMode('register'); setErrors({}); setPassword(''); navigate(ROUTES.REGISTER); }}
                disabled={isProcessing}
              >
                Daftar sekarang
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-primary-600)', fontWeight: 600, padding: '0' }}
                onClick={() => { setMode('login'); setErrors({}); setPassword(''); navigate(ROUTES.LOGIN); }}
                disabled={isProcessing}
              >
                Masuk
              </button>
            </>
          )}
          {mode === 'reset' && (
            <>
              Ingat password Anda?{' '}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-primary-600)', fontWeight: 600, padding: '0' }}
                onClick={() => { setMode('login'); setErrors({}); navigate(ROUTES.LOGIN); }}
                disabled={isProcessing}
              >
                Kembali ke halaman masuk
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

