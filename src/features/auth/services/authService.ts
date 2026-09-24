import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use':
      'Email ini sudah terdaftar. Silakan login.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/user-not-found': 'Akun tidak ditemukan.',
    'auth/wrong-password': 'Password salah. Silakan coba lagi.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/user-disabled': 'Akun telah dinonaktifkan.',
    'auth/too-many-requests': 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.',
    'auth/network-request-failed': 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda.',
    'auth/popup-closed-by-user': 'Proses login Google dibatalkan karena popup ditutup.',
    'auth/popup-blocked': 'Popup autentikasi diblokir oleh browser. Harap izinkan popup pada browser Anda.',
    'auth/cancelled-popup-request': 'Permintaan login Google dibatalkan.',
    'auth/account-exists-with-different-credential':
      'Email ini sudah terdaftar menggunakan metode login lain. Silakan masuk menggunakan Email dan Password.',
    'auth/unauthorized-domain': 'Domain aplikasi ini belum terdaftar di Firebase Authorized Domains.',
    'auth/operation-not-allowed': 'Metode login Google belum diaktifkan di Firebase Console.',
  };
  return messages[code] ?? 'Terjadi kesalahan pada proses autentikasi.';
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  await updateProfile(user, { displayName: displayName.trim() });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: displayName.trim(),
    photoURL: null,
    provider: 'password',
    coupleId: null,
    partnerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

export async function login(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

