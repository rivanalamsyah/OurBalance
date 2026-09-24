/**
 * Firebase Centralized Configuration — OurBalance
 *
 * All credentials come from environment variables (.env.local).
 * Never hardcode Firebase credentials in source code.
 *
 * Spark Plan (free tier) usage:
 *  - Firebase Authentication (Email/Password)
 *  - Cloud Firestore
 *  - (Optional) Firebase Analytics — loaded only in production
 *
 * No Cloud Functions, Storage, or any paid services required.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// ─────────────────────────────────────────────
// 1. Validate required environment variables
// ─────────────────────────────────────────────
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const varName of requiredVars) {
  if (!import.meta.env[varName]) {
    throw new Error(
      `[Firebase] Missing required environment variable: ${varName}.\n` +
        'Copy .env.example → .env.local and fill in your Firebase project credentials.'
    );
  }
}

// ─────────────────────────────────────────────
// 2. Firebase configuration object
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

// ─────────────────────────────────────────────
// 3. Initialize Firebase (prevent duplicate init)
// ─────────────────────────────────────────────
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ─────────────────────────────────────────────
// 4. Export Auth & Firestore singletons
// ─────────────────────────────────────────────
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// ─────────────────────────────────────────────
// 5. Emulator support (set USE_EMULATOR=true in .env.local)
// ─────────────────────────────────────────────
if (
  import.meta.env.VITE_USE_EMULATOR === 'true' &&
  typeof window !== 'undefined' &&
  !(db as any)._settings?.host?.includes('localhost')
) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  // Auth emulator can be connected similarly if needed:
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

// ─────────────────────────────────────────────
// 6. Optional: Analytics (production only, non-blocking)
// ─────────────────────────────────────────────
if (
  import.meta.env.PROD &&
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
) {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) getAnalytics(app);
    });
  });
}

export default app;
