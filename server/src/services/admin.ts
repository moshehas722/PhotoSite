import { Request, Response, NextFunction } from 'express';
import { getAdminEmailList } from './config';

export function getEnvAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (getEnvAdminEmails().includes(normalized)) return true;
  const firestoreList = await getAdminEmailList();
  return firestoreList.includes(normalized);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user?.isAdmin) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  next();
}
