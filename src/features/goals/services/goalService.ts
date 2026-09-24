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
  increment,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Goal, GoalContribution } from '../../../types';

const COL = 'goals';
const CONTRIB_COL = 'goalContributions';

export async function addGoal(
  data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    currentAmount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGoal(
  id: string,
  data: Partial<Omit<Goal, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Goal;
}

export function subscribeGoals(coupleId: string, callback: (goals: Goal[]) => void) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal)));
  });
}

export async function addContribution(
  goalId: string,
  data: Omit<GoalContribution, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, CONTRIB_COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COL, goalId), {
    currentAmount: increment(data.amount),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeContributions(
  goalId: string,
  callback: (contribs: GoalContribution[]) => void
) {
  const q = query(
    collection(db, CONTRIB_COL),
    where('goalId', '==', goalId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GoalContribution)));
  });
}
