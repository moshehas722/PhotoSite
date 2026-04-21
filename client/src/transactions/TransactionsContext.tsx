import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthContext';

export interface Transaction {
  id: string;
  userSub: string;
  userEmail: string;
  userName: string;
  photoIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  decidedAt?: number;
  decidedByEmail?: string;
  rejectionNote?: string;
}

interface TransactionsContextValue {
  approvedIds: Set<string>;
  pendingIds: Set<string>;
  approvedTransactions: Transaction[];
  pendingTransactions: Transaction[];
  refresh: () => Promise<void>;
  submitTransaction: (photoIds: string[]) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

async function fetchMine(status: 'pending' | 'approved'): Promise<Transaction[]> {
  const res = await fetch(`/api/transactions/mine?status=${status}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { transactions: Transaction[] };
  return data.transactions;
}

const unionPhotoIds = (txs: Transaction[]): Set<string> => {
  const s = new Set<string>();
  for (const tx of txs) for (const id of tx.photoIds) s.add(id);
  return s;
};

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [approvedTransactions, setApproved] = useState<Transaction[]>([]);
  const [pendingTransactions, setPending] = useState<Transaction[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setApproved([]);
      setPending([]);
      return;
    }
    try {
      const [approved, pending] = await Promise.all([
        fetchMine('approved'),
        fetchMine('pending'),
      ]);
      setApproved(approved);
      setPending(pending);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, [user]);

  const submitTransaction = useCallback(
    async (photoIds: string[]) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) throw new Error('Failed to submit transaction');
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <TransactionsContext.Provider
      value={{
        approvedIds: unionPhotoIds(approvedTransactions),
        pendingIds: unionPhotoIds(pendingTransactions),
        approvedTransactions,
        pendingTransactions,
        refresh,
        submitTransaction,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
