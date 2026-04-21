import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface PurchasesContextValue {
  purchasedIds: Set<string>;
  refresh: () => Promise<void>;
  recordPurchase: (photoIds: string[]) => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setPurchasedIds(new Set());
      return;
    }
    try {
      const res = await fetch('/api/purchases', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { photoIds: string[] };
      setPurchasedIds(new Set(data.photoIds));
    } catch (err) {
      console.error('Failed to load purchases:', err);
    }
  }, [user]);

  const recordPurchase = useCallback(
    async (photoIds: string[]) => {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) throw new Error('Failed to record purchase');
      setPurchasedIds((prev) => {
        const next = new Set(prev);
        for (const id of photoIds) next.add(id);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <PurchasesContext.Provider value={{ purchasedIds, refresh, recordPurchase }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
