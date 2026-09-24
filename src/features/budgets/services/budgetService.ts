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
import type { Budget } from '../../../types';

const COL = 'budgets';

export async function addBudget(
  data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    spent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBudget(
  id: string,
  data: Partial<Omit<Budget, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Budget;
}

export function subscribeBudgets(
  coupleId: string,
  month: string,
  callback: (budgets: Budget[]) => void
) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    where('month', '==', month),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)));
  });
}
