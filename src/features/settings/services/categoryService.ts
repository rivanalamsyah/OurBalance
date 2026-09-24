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
import type { Category } from '../../../types';

const COL = 'categories';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Food & Dining', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Transportation', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Shopping', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Entertainment', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Health', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Bills & Utilities', type: 'expense', scope: 'shared', isDefault: true, coupleId: '' },
  { name: 'Rent', type: 'expense', scope: 'shared', isDefault: true, coupleId: '' },
  { name: 'Groceries', type: 'expense', scope: 'shared', isDefault: true, coupleId: '' },
  { name: 'Education', type: 'expense', scope: 'personal', isDefault: true, coupleId: '' },
  { name: 'Personal Care', type: 'expense', scope: 'personal', isDefault: true, coupleId: '' },
  { name: 'Savings', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Other Expense', type: 'expense', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Salary', type: 'income', scope: 'personal', isDefault: true, coupleId: '' },
  { name: 'Freelance', type: 'income', scope: 'personal', isDefault: true, coupleId: '' },
  { name: 'Investment Return', type: 'income', scope: 'both', isDefault: true, coupleId: '' },
  { name: 'Bonus', type: 'income', scope: 'personal', isDefault: true, coupleId: '' },
  { name: 'Other Income', type: 'income', scope: 'both', isDefault: true, coupleId: '' },
];

export async function seedDefaultCategories(coupleId: string): Promise<void> {
  const existing = await getDocs(
    query(collection(db, COL), where('coupleId', '==', coupleId))
  );
  if (!existing.empty) return;

  const batch = [];
  for (const cat of DEFAULT_CATEGORIES) {
    batch.push(
      addDoc(collection(db, COL), {
        ...cat,
        coupleId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  }
  await Promise.all(batch);
}

export async function addCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function subscribeCategories(coupleId: string, callback: (cats: Category[]) => void) {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('name', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
  });
}

export async function getCategories(coupleId: string): Promise<Category[]> {
  const snap = await getDocs(
    query(collection(db, COL), where('coupleId', '==', coupleId), orderBy('name', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}
