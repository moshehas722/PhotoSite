import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';

const firestore = new Firestore();
const COLLECTION = 'transactions';

export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface Transaction {
  id: string;
  userSub: string;
  userEmail: string;
  userName: string;
  photoIds: string[];
  status: TransactionStatus;
  createdAt: number; // millis since epoch
  decidedAt?: number;
  decidedByEmail?: string;
  rejectionNote?: string;
}

interface CreatorUser {
  sub: string;
  email: string;
  name: string;
}

const tsToMillis = (v: unknown): number | undefined =>
  v instanceof Timestamp ? v.toMillis() : undefined;

function toTransaction(id: string, data: FirebaseFirestore.DocumentData): Transaction {
  return {
    id,
    userSub: data.userSub,
    userEmail: data.userEmail,
    userName: data.userName,
    photoIds: data.photoIds ?? [],
    status: data.status,
    createdAt: tsToMillis(data.createdAt) ?? 0,
    decidedAt: tsToMillis(data.decidedAt),
    decidedByEmail: data.decidedByEmail,
    rejectionNote: data.rejectionNote,
  };
}

export async function createTransaction(user: CreatorUser, photoIds: string[]): Promise<string> {
  const ref = await firestore.collection(COLLECTION).add({
    userSub: user.sub,
    userEmail: user.email,
    userName: user.name,
    photoIds,
    status: 'pending' as TransactionStatus,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listMyTransactions(
  userSub: string,
  status: TransactionStatus
): Promise<Transaction[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', userSub)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => toTransaction(d.id, d.data()));
}

export async function listPendingForAdmin(): Promise<Transaction[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .get();
  return snap.docs.map((d) => toTransaction(d.id, d.data()));
}

export async function hasPurchased(userSub: string, photoId: string): Promise<boolean> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', userSub)
    .where('status', '==', 'approved')
    .where('photoIds', 'array-contains', photoId)
    .limit(1)
    .get();
  return !snap.empty;
}

export async function approveTransaction(id: string, adminEmail: string): Promise<void> {
  await firestore.collection(COLLECTION).doc(id).update({
    status: 'approved' as TransactionStatus,
    decidedAt: FieldValue.serverTimestamp(),
    decidedByEmail: adminEmail,
  });
}

export async function rejectTransaction(
  id: string,
  adminEmail: string,
  note?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    status: 'rejected' as TransactionStatus,
    decidedAt: FieldValue.serverTimestamp(),
    decidedByEmail: adminEmail,
  };
  if (note) update.rejectionNote = note;
  await firestore.collection(COLLECTION).doc(id).update(update);
}

export type CancelPendingResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'not_pending' };

export async function cancelPendingTransaction(
  id: string,
  userSub: string,
  userEmail: string
): Promise<CancelPendingResult> {
  const ref = firestore.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not_found' };
  const data = snap.data()!;
  if (data.userSub !== userSub) return { ok: false, reason: 'forbidden' };
  if (data.status !== 'pending') return { ok: false, reason: 'not_pending' };
  await ref.update({
    status: 'rejected' as TransactionStatus,
    decidedAt: FieldValue.serverTimestamp(),
    decidedByEmail: userEmail,
    rejectionNote: 'Cancelled by user',
  });
  return { ok: true };
}
