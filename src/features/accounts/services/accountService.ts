import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Account } from '../../../types';

const COL = 'accounts';

export async function addAccount(
  data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAccount(
  id: string,
  data: Partial<Omit<Account, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getAccountById(id: string): Promise<Account | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Account;
}

export async function getAccounts(coupleId: string): Promise<Account[]> {
  const snap = await getDocs(
    query(collection(db, COL), where('coupleId', '==', coupleId), orderBy('createdAt', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
}

export function subscribeAccounts(coupleId: string, callback: (accounts: Account[]) => void) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account)));
  });
}
