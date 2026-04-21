import { Request, Response, NextFunction } from 'express';

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user?.isAdmin) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  next();
}
