import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { notifyAdminFolderAccessRequest, notifyUserFolderAccessApproved } from './email';

const firestore = new Firestore();
const COLLECTION = 'folderAccessRequests';

export type FolderAccessStatus = 'pending' | 'approved' | 'rejected';

export interface FolderAccessRequest {
  id: string;
  userSub: string;
  userEmail: string;
  userName: string;
  folderId: string;
  folderName: string;
  status: FolderAccessStatus;
  createdAt: number;
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

function toRequest(id: string, data: FirebaseFirestore.DocumentData): FolderAccessRequest {
  return {
    id,
    userSub: data.userSub,
    userEmail: data.userEmail,
    userName: data.userName,
    folderId: data.folderId,
    folderName: data.folderName,
    status: data.status,
    createdAt: tsToMillis(data.createdAt) ?? 0,
    decidedAt: tsToMillis(data.decidedAt),
    decidedByEmail: data.decidedByEmail,
    rejectionNote: data.rejectionNote,
  };
}

export async function createFolderAccessRequest(
  user: CreatorUser,
  folderId: string,
  folderName: string
): Promise<string> {
  const existing = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', user.sub)
    .where('folderId', '==', folderId)
    .where('status', 'in', ['pending', 'approved'])
    .limit(1)
    .get();
  if (!existing.empty) {
    const status = existing.docs[0].data().status as FolderAccessStatus;
    const err = new Error(`Already has ${status} request`) as Error & { code: string };
    err.code = 'DUPLICATE';
    throw err;
  }
  const ref = await firestore.collection(COLLECTION).add({
    userSub: user.sub,
    userEmail: user.email,
    userName: user.name,
    folderId,
    folderName,
    status: 'pending' as FolderAccessStatus,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Fire-and-forget — don't fail the request if email sending fails
  notifyAdminFolderAccessRequest(user.name, user.email, folderName).catch((err) =>
    console.error('[email] Failed to notify admin:', err)
  );

  return ref.id;
}

export async function listMyFolderAccessRequests(userSub: string): Promise<FolderAccessRequest[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', userSub)
    .get();
  const docs = snap.docs.map((d) => toRequest(d.id, d.data()));
  docs.sort((a, b) => b.createdAt - a.createdAt);
  return docs;
}

export async function listPendingFolderAccessRequests(): Promise<FolderAccessRequest[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('status', '==', 'pending')
    .get();
  const docs = snap.docs.map((d) => toRequest(d.id, d.data()));
  docs.sort((a, b) => a.createdAt - b.createdAt);
  return docs;
}

export async function listApprovedFolderAccessForUser(userSub: string): Promise<FolderAccessRequest[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', userSub)
    .where('status', '==', 'approved')
    .get();
  const docs = snap.docs.map((d) => toRequest(d.id, d.data()));
  docs.sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0));
  return docs;
}

export async function revokeFolderAccess(id: string): Promise<void> {
  await firestore.collection(COLLECTION).doc(id).delete();
}

export async function hasFolderAccess(userSub: string, folderId: string): Promise<boolean> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('userSub', '==', userSub)
    .where('folderId', '==', folderId)
    .where('status', '==', 'approved')
    .limit(1)
    .get();
  return !snap.empty;
}

export async function approveFolderAccessRequest(id: string, adminEmail: string): Promise<void> {
  const snap = await firestore.collection(COLLECTION).doc(id).get();
  await firestore.collection(COLLECTION).doc(id).update({
    status: 'approved' as FolderAccessStatus,
    decidedAt: FieldValue.serverTimestamp(),
    decidedByEmail: adminEmail,
  });
  const data = snap.data();
  if (data) {
    notifyUserFolderAccessApproved(data.userEmail, data.userName, data.folderName, data.folderId).catch((err) =>
      console.error('[email] Failed to notify user of approval:', err)
    );
  }
}

export async function rejectFolderAccessRequest(
  id: string,
  adminEmail: string,
  note?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    status: 'rejected' as FolderAccessStatus,
    decidedAt: FieldValue.serverTimestamp(),
    decidedByEmail: adminEmail,
  };
  if (note) update.rejectionNote = note;
  await firestore.collection(COLLECTION).doc(id).update(update);
}
