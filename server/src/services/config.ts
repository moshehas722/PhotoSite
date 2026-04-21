import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();
const CONFIG_DOC = 'config/settings';

export async function getDriveFolderId(): Promise<string> {
  try {
    const doc = await firestore.doc(CONFIG_DOC).get();
    const id = doc.data()?.driveFolderId as string | undefined;
    if (id) return id;
  } catch {
    // fall through to env var
  }
  const envId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!envId) throw new Error('Drive folder ID not configured');
  return envId;
}

export async function setDriveFolderId(folderId: string): Promise<void> {
  await firestore.doc(CONFIG_DOC).set({ driveFolderId: folderId }, { merge: true });
}

export async function getAboutContent(): Promise<string> {
  try {
    const doc = await firestore.doc(CONFIG_DOC).get();
    const content = doc.data()?.aboutContent as string | undefined;
    if (content !== undefined) return content;
  } catch { /* fall through */ }
  return '';
}

export async function setAboutContent(content: string): Promise<void> {
  await firestore.doc(CONFIG_DOC).set({ aboutContent: content }, { merge: true });
}

export async function getAdminEmailList(): Promise<string[]> {
  try {
    const doc = await firestore.doc(CONFIG_DOC).get();
    const list = doc.data()?.adminEmails as string[] | undefined;
    return list ?? [];
  } catch { return []; }
}

export async function addAdminEmail(email: string): Promise<void> {
  const current = await getAdminEmailList();
  const normalized = email.toLowerCase().trim();
  if (!current.includes(normalized)) {
    await firestore.doc(CONFIG_DOC).set({ adminEmails: [...current, normalized] }, { merge: true });
  }
}

export async function removeAdminEmail(email: string): Promise<void> {
  const current = await getAdminEmailList();
  const normalized = email.toLowerCase().trim();
  await firestore.doc(CONFIG_DOC).set(
    { adminEmails: current.filter((e) => e !== normalized) },
    { merge: true }
  );
}

export interface SiteProfile {
  phone: string;
  instagram: string;
  facebook: string;
}

export async function getProfile(): Promise<SiteProfile> {
  try {
    const doc = await firestore.doc(CONFIG_DOC).get();
    const d = doc.data() ?? {};
    return {
      phone: (d.phone as string | undefined) ?? '',
      instagram: (d.instagram as string | undefined) ?? '',
      facebook: (d.facebook as string | undefined) ?? '',
    };
  } catch { return { phone: '', instagram: '', facebook: '' }; }
}

export async function setProfile(profile: Partial<SiteProfile>): Promise<void> {
  await firestore.doc(CONFIG_DOC).set(profile, { merge: true });
}
