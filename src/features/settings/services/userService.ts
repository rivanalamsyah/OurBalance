import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { UserProfile } from '../../../types';
import { seedDefaultCategories } from './categoryService';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createCouple(userId1: string, userId2: string): Promise<string> {
  const existing = await getDocs(
    query(
      collection(db, 'couples'),
      where('member1Id', 'in', [userId1, userId2])
    )
  );

  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const ref = await addDoc(collection(db, 'couples'), {
    member1Id: userId1,
    member2Id: userId2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all([
    updateDoc(doc(db, 'users', userId1), {
      coupleId: ref.id,
      partnerId: userId2,
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'users', userId2), {
      coupleId: ref.id,
      partnerId: userId1,
      updatedAt: serverTimestamp(),
    }),
  ]);

  await seedDefaultCategories(ref.id);

  return ref.id;
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('email', '==', email))
  );
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

export async function getPartnerProfile(partnerId: string): Promise<UserProfile | null> {
  return getUserProfile(partnerId);
}

export async function ensureCoupleId(uid: string): Promise<string> {
  const profile = await getUserProfile(uid);
  if (profile?.coupleId) return profile.coupleId;

  const ref = await addDoc(collection(db, 'couples'), {
    member1Id: uid,
    member2Id: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', uid), {
    coupleId: ref.id,
    updatedAt: serverTimestamp(),
  });

  await seedDefaultCategories(ref.id);

  return ref.id;
}
