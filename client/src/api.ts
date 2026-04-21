import type { FolderContents, RecentFolder } from './types';
import type { Transaction } from './transactions/TransactionsContext';

export async function fetchFolderContents(folderId: string): Promise<FolderContents> {
  const res = await fetch(`/api/folders/${encodeURIComponent(folderId)}`);
  if (!res.ok) throw new Error(`Failed to fetch folder: ${res.statusText}`);
  return res.json();
}

export async function fetchRecentFolders(): Promise<RecentFolder[]> {
  const res = await fetch('/api/folders/recent');
  if (!res.ok) throw new Error('Failed to fetch recent folders');
  const data = (await res.json()) as { folders: RecentFolder[] };
  return data.folders;
}

export async function fetchPendingTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/admin/transactions/pending', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch pending transactions: ${res.statusText}`);
  const data = (await res.json()) as { transactions: Transaction[] };
  return data.transactions;
}

export async function approveTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/admin/transactions/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.statusText}`);
}

export async function rejectTransaction(id: string, note?: string): Promise<void> {
  const res = await fetch(`/api/admin/transactions/${id}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error(`Reject failed: ${res.statusText}`);
}

export interface AdminSettings {
  driveFolderId: string;
  serviceAccountEmail: string;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const res = await fetch('/api/admin/settings', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
  return res.json();
}

export async function fetchAboutContent(): Promise<string> {
  const res = await fetch('/api/about');
  if (!res.ok) return '';
  const data = (await res.json()) as { content: string };
  return data.content;
}

export async function saveAboutContent(content: string): Promise<void> {
  const res = await fetch('/api/admin/about', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Failed to save: ${res.statusText}`);
  }
}

export async function saveAdminSettings(driveFolderId: string): Promise<void> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driveFolderId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Failed to save settings: ${res.statusText}`);
  }
}

export interface AdminEntry {
  email: string;
  source: 'env' | 'firestore';
}

export async function fetchAdmins(): Promise<AdminEntry[]> {
  const res = await fetch('/api/admin/administrators', { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch administrators: ${res.statusText}`);
  const data = (await res.json()) as { admins: AdminEntry[] };
  return data.admins;
}

export async function addAdmin(email: string): Promise<void> {
  const res = await fetch('/api/admin/administrators', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Failed to add administrator: ${res.statusText}`);
  }
}

export async function removeAdmin(email: string): Promise<void> {
  const res = await fetch(`/api/admin/administrators/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Failed to remove administrator: ${res.statusText}`);
  }
}
