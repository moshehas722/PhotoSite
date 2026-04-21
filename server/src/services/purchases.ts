import { Firestore, FieldValue } from '@google-cloud/firestore';

const firestore = new Firestore();
const COLLECTION = 'purchases';

const docId = (userSub: string, photoId: string) => `${userSub}_${photoId}`;

export async function recordPurchases(userSub: string, photoIds: string[]): Promise<number> {
  if (photoIds.length === 0) return 0;
  const batch = firestore.batch();
  for (const photoId of photoIds) {
    const ref = firestore.collection(COLLECTION).doc(docId(userSub, photoId));
    batch.set(
      ref,
      { userSub, photoId, purchasedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
  return photoIds.length;
}

export async function listPurchasedPhotoIds(userSub: string): Promise<string[]> {
  const snap = await firestore.collection(COLLECTION).where('userSub', '==', userSub).get();
  return snap.docs.map((d) => d.data().photoId as string);
}

export async function hasPurchased(userSub: string, photoId: string): Promise<boolean> {
  const doc = await firestore.collection(COLLECTION).doc(docId(userSub, photoId)).get();
  return doc.exists;
}
