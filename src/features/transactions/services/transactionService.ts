import {
  collection,
  doc,
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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Transaction, TransactionType } from '../../../types';

const COL = 'transactions';

export async function addTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const newTxRef = doc(collection(db, COL));
  const mainAccRef = doc(db, 'accounts', data.accountId);
  const toAccRef = data.toAccountId ? doc(db, 'accounts', data.toAccountId) : null;

  await runTransaction(db, async (txn) => {
    const mainAccSnap = await txn.get(mainAccRef);
    let toAccSnap = null;
    if (toAccRef) {
      toAccSnap = await txn.get(toAccRef);
    }

    // Insert transaction document
    txn.set(newTxRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Adjust main account balance
    if (mainAccSnap.exists()) {
      const currentBal = mainAccSnap.data().balance || 0;
      let diff = 0;
      if (data.type === 'income') diff = data.amount;
      else if (data.type === 'expense' || data.type === 'shared_expense') diff = -data.amount;
      else if (data.type === 'transfer') diff = -data.amount;

      txn.update(mainAccRef, {
        balance: currentBal + diff,
        updatedAt: serverTimestamp(),
      });
    }

    // Adjust target account balance if transfer
    if (toAccRef && toAccSnap && toAccSnap.exists() && data.type === 'transfer') {
      const currentToBal = toAccSnap.data().balance || 0;
      txn.update(toAccRef, {
        balance: currentToBal + data.amount,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return newTxRef.id;
}

export async function updateTransaction(
  id: string,
  newData: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  const txRef = doc(db, COL, id);

  await runTransaction(db, async (txn) => {
    const txSnap = await txn.get(txRef);
    if (!txSnap.exists()) {
      throw new Error('Transaction not found');
    }

    const oldTx = { id: txSnap.id, ...txSnap.data() } as Transaction;
    const mergedTx = { ...oldTx, ...newData };

    // Collect all involved account IDs
    const accountIdsToFetch = new Set<string>();
    if (oldTx.accountId) accountIdsToFetch.add(oldTx.accountId);
    if (oldTx.toAccountId) accountIdsToFetch.add(oldTx.toAccountId);
    if (mergedTx.accountId) accountIdsToFetch.add(mergedTx.accountId);
    if (mergedTx.toAccountId) accountIdsToFetch.add(mergedTx.toAccountId);

    const accountSnaps: Record<string, { ref: any; balance: number }> = {};
    for (const accId of accountIdsToFetch) {
      const accRef = doc(db, 'accounts', accId);
      const snap = await txn.get(accRef);
      if (snap.exists()) {
        accountSnaps[accId] = { ref: accRef, balance: snap.data().balance || 0 };
      }
    }

    // Calculate balance changes per accountId
    const balanceDeltas: Record<string, number> = {};
    accountIdsToFetch.forEach((accId) => {
      balanceDeltas[accId] = 0;
    });

    // Revert old transaction
    if (oldTx.accountId) {
      if (oldTx.type === 'income') balanceDeltas[oldTx.accountId] -= oldTx.amount;
      else if (oldTx.type === 'expense' || oldTx.type === 'shared_expense') balanceDeltas[oldTx.accountId] += oldTx.amount;
      else if (oldTx.type === 'transfer') balanceDeltas[oldTx.accountId] += oldTx.amount;
    }
    if (oldTx.type === 'transfer' && oldTx.toAccountId) {
      balanceDeltas[oldTx.toAccountId] -= oldTx.amount;
    }

    // Apply merged transaction
    if (mergedTx.accountId) {
      if (mergedTx.type === 'income') balanceDeltas[mergedTx.accountId] += mergedTx.amount;
      else if (mergedTx.type === 'expense' || mergedTx.type === 'shared_expense') balanceDeltas[mergedTx.accountId] -= mergedTx.amount;
      else if (mergedTx.type === 'transfer') balanceDeltas[mergedTx.accountId] -= mergedTx.amount;
    }
    if (mergedTx.type === 'transfer' && mergedTx.toAccountId) {
      balanceDeltas[mergedTx.toAccountId] += mergedTx.amount;
    }

    // Update transaction doc
    txn.update(txRef, {
      ...newData,
      updatedAt: serverTimestamp(),
    });

    // Apply balance updates to account docs
    for (const [accId, delta] of Object.entries(balanceDeltas)) {
      if (delta !== 0 && accountSnaps[accId]) {
        const newBal = accountSnaps[accId].balance + delta;
        txn.update(accountSnaps[accId].ref, {
          balance: newBal,
          updatedAt: serverTimestamp(),
        });
      }
    }
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const txRef = doc(db, COL, id);

  await runTransaction(db, async (txn) => {
    const txSnap = await txn.get(txRef);
    if (!txSnap.exists()) return;

    const oldTx = { id: txSnap.id, ...txSnap.data() } as Transaction;
    const mainAccRef = doc(db, 'accounts', oldTx.accountId);
    const toAccRef = oldTx.toAccountId ? doc(db, 'accounts', oldTx.toAccountId) : null;

    const mainAccSnap = await txn.get(mainAccRef);
    let toAccSnap = null;
    if (toAccRef) {
      toAccSnap = await txn.get(toAccRef);
    }

    if (mainAccSnap.exists()) {
      const currentBal = mainAccSnap.data().balance || 0;
      let revertDiff = 0;
      if (oldTx.type === 'income') revertDiff = -oldTx.amount;
      else if (oldTx.type === 'expense' || oldTx.type === 'shared_expense') revertDiff = oldTx.amount;
      else if (oldTx.type === 'transfer') revertDiff = oldTx.amount;

      txn.update(mainAccRef, {
        balance: currentBal + revertDiff,
        updatedAt: serverTimestamp(),
      });
    }

    if (toAccRef && toAccSnap && toAccSnap.exists() && oldTx.type === 'transfer') {
      const currentToBal = toAccSnap.data().balance || 0;
      txn.update(toAccRef, {
        balance: currentToBal - oldTx.amount,
        updatedAt: serverTimestamp(),
      });
    }

    txn.delete(txRef);
  });
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
