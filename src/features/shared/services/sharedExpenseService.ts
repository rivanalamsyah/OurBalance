import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { SharedExpense, Settlement } from '../../../types';

const COL = 'sharedExpenses';
const SETTLE_COL = 'settlements';

export async function addSharedExpense(
  data: Omit<SharedExpense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    isSettled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSharedExpense(
  id: string,
  data: Partial<Omit<SharedExpense, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSharedExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function subscribeSharedExpenses(
  coupleId: string,
  callback: (expenses: SharedExpense[]) => void
) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SharedExpense)));
  });
}

export async function settleExpense(
  coupleId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  description?: string
): Promise<void> {
  await addDoc(collection(db, SETTLE_COL), {
    coupleId,
    fromUserId,
    toUserId,
    amount,
    description: description || 'Pelunasan',
    settledAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeSettlements(
  coupleId: string,
  callback: (settlements: Settlement[]) => void
) {
  const q = query(
    collection(db, SETTLE_COL),
    where('coupleId', '==', coupleId),
    orderBy('settledAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement)));
  });
}

export function calculateBalance(
  sharedExpenses: SharedExpense[],
  userId: string,
  partnerId: string
): { balance: number; owes: string | null; amount: number } {
  let balance = 0;

  for (const expense of sharedExpenses) {
    if (expense.isSettled) continue;
    const mySplit = expense.splits.find((s) => s.userId === userId);
    if (!mySplit) continue;

    if (expense.paidBy === userId) {
      const partnerSplit = expense.splits.find((s) => s.userId === partnerId);
      if (partnerSplit) balance += partnerSplit.amount;
    } else if (expense.paidBy === partnerId) {
      balance -= mySplit.amount;
    }
  }

  if (balance > 0) {
    return { balance, owes: partnerId, amount: balance };
  } else if (balance < 0) {
    return { balance, owes: userId, amount: Math.abs(balance) };
  }
  return { balance: 0, owes: null, amount: 0 };
}
