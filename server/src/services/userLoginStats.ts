import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';

const firestore = new Firestore();
const COLLECTION = 'users';

export interface UserLoginListEntry {
  userSub: string;
  email: string;
  name: string;
  picture?: string;
  loginCount: number;
  lastLoginAt: number | null;
  fullAccess: boolean;
}

const tsToMillis = (v: unknown): number | null =>
  v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : null;

/** All stored users who have logged in at least once, highest login count first. */
export async function listUsersByLoginCount(): Promise<UserLoginListEntry[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .orderBy('loginCount', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const n = typeof d.loginCount === 'number' ? d.loginCount : Number(d.loginCount ?? 0);
    return {
      userSub: typeof d.userSub === 'string' ? d.userSub : doc.id,
      email: typeof d.email === 'string' ? d.email : '',
      name: typeof d.name === 'string' ? d.name : '',
      picture: typeof d.picture === 'string' ? d.picture : undefined,
      loginCount: Number.isFinite(n) ? n : 0,
      lastLoginAt: tsToMillis(d.lastLoginAt),
      fullAccess: d.fullAccess === true,
    };
  });
}

export async function getFullAccess(userSub: string): Promise<boolean> {
  try {
    const snap = await firestore.collection(COLLECTION).doc(userSub).get();
    if (!snap.exists) return false;
    return snap.data()?.fullAccess === true;
  } catch (err) {
    console.error('Firestore getFullAccess failed:', err);
    return false;
  }
}

export async function setUserFullAccess(userSub: string, fullAccess: boolean): Promise<void> {
  await firestore.collection(COLLECTION).doc(userSub).set(
    {
      fullAccess,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Persist per-user login analytics. Document id is Google OAuth `sub` (stable account id).
 */
export async function recordLogin(payload: {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<void> {
  const doc: Record<string, unknown> = {
    userSub: payload.sub,
    email: payload.email,
    name: payload.name,
    loginCount: FieldValue.increment(1),
    lastLoginAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (payload.picture !== undefined) doc.picture = payload.picture;

  await firestore.collection(COLLECTION).doc(payload.sub).set(doc, { merge: true });
}
