import { Store, SessionData } from 'express-session';
import { Firestore } from '@google-cloud/firestore';

export class FirestoreSessionStore extends Store {
  private collection;

  constructor(firestore: Firestore, collectionName = 'sessions') {
    super();
    this.collection = firestore.collection(collectionName);
  }

  get = (sid: string, cb: (err: unknown, session?: SessionData | null) => void) => {
    this.collection
      .doc(sid)
      .get()
      .then((doc) => {
        if (!doc.exists) return cb(null, null);
        const data = doc.data() as { session?: string; expiresAt?: number } | undefined;
        if (!data?.session) return cb(null, null);
        if (data.expiresAt && data.expiresAt < Date.now()) {
          this.collection.doc(sid).delete().catch(() => {});
          return cb(null, null);
        }
        try {
          cb(null, JSON.parse(data.session) as SessionData);
        } catch (err) {
          cb(err);
        }
      })
      .catch((err) => cb(err));
  };

  set = (sid: string, session: SessionData, cb?: (err?: unknown) => void) => {
    const expiresAt =
      session.cookie?.expires instanceof Date
        ? session.cookie.expires.getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000;
    this.collection
      .doc(sid)
      .set({ session: JSON.stringify(session), expiresAt })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  };

  destroy = (sid: string, cb?: (err?: unknown) => void) => {
    this.collection
      .doc(sid)
      .delete()
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  };

  touch = (sid: string, session: SessionData, cb?: (err?: unknown) => void) => {
    const expiresAt =
      session.cookie?.expires instanceof Date
        ? session.cookie.expires.getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000;
    this.collection
      .doc(sid)
      .set({ expiresAt }, { merge: true })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  };
}
