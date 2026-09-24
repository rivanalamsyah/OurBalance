import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  register as authRegister,
  resetPassword as authResetPassword,
  onAuthChange,
} from '../features/auth/services/authService';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch {
      return null;
    }
  }

  async function ensureProfile(firebaseUser: User): Promise<UserProfile | null> {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      updateDoc(ref, { updatedAt: serverTimestamp() }).catch(() => {});
      return snap.data() as UserProfile;
    }

    const primaryProvider = firebaseUser.providerData[0]?.providerId || 'google.com';
    const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName:
        firebaseUser.displayName ??
        firebaseUser.email?.split('@')[0] ??
        'User',
      photoURL: firebaseUser.photoURL ?? undefined,
      provider: primaryProvider,
      coupleId: undefined,
      partnerId: undefined,
    };
    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return profile as UserProfile;
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await ensureProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const firebaseUser = await authLogin(email, password);
    const profile = await fetchProfile(firebaseUser.uid);
    setUserProfile(profile);
  }

  async function loginWithGoogle(): Promise<void> {
    const firebaseUser = await authLoginWithGoogle();
    const profile = await fetchProfile(firebaseUser.uid);
    setUserProfile(profile);
  }

  async function register(
    email: string,
    password: string,
    displayName: string
  ): Promise<void> {
    const firebaseUser = await authRegister(email, password, displayName);
    const profile = await fetchProfile(firebaseUser.uid);
    setUserProfile(profile);
  }

  async function logout(): Promise<void> {
    await authLogout();
    setUser(null);
    setUserProfile(null);
  }

  async function resetPassword(email: string): Promise<void> {
    await authResetPassword(email);
  }

  async function refreshProfile(): Promise<void> {
    if (!user) return;
    const profile = await fetchProfile(user.uid);
    setUserProfile(profile);
  }

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

