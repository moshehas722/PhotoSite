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
