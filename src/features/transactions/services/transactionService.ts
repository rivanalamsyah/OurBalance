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
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Transaction, TransactionType } from '../../../types';

const COL = 'transactions';

export async function addTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Transaction;
}

export async function getTransactions(
  coupleId: string,
  filters?: {
    type?: TransactionType;
    categoryId?: string;
    accountId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limitCount?: number
): Promise<Transaction[]> {
  const constraints: QueryConstraint[] = [
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc'),
  ];

  if (filters?.type) constraints.push(where('type', '==', filters.type));
  if (filters?.userId) constraints.push(where('userId', '==', filters.userId));
  if (filters?.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
  if (filters?.accountId) constraints.push(where('accountId', '==', filters.accountId));
  if (filters?.startDate)
    constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
  if (filters?.endDate)
    constraints.push(where('date', '<=', Timestamp.fromDate(filters.endDate)));
  if (limitCount) constraints.push(limit(limitCount));

  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}

export function subscribeTransactions(
  coupleId: string,
  callback: (transactions: Transaction[]) => void,
  limitCount: number = 100
) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    const txns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
    callback(txns);
  });
}
