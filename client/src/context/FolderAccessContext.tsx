import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchMyFolderAccessRequests, requestFolderAccess } from '../api';

interface FolderAccessContextValue {
  approvedFolderIds: Set<string>;
  pendingFolderIds: Set<string>;
  requestAccess: (folderId: string, folderName: string) => Promise<void>;
  refresh: () => void;
}

const FolderAccessContext = createContext<FolderAccessContextValue>({
  approvedFolderIds: new Set(),
  pendingFolderIds: new Set(),
  requestAccess: async () => {},
  refresh: () => {},
});

export function FolderAccessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [approvedFolderIds, setApprovedFolderIds] = useState<Set<string>>(new Set());
  const [pendingFolderIds, setPendingFolderIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) {
      setApprovedFolderIds(new Set());
      setPendingFolderIds(new Set());
      return;
    }
    try {
      const requests = await fetchMyFolderAccessRequests();
      const approved = new Set<string>();
      const pending = new Set<string>();
      for (const req of requests) {
        if (req.status === 'approved') approved.add(req.folderId);
        else if (req.status === 'pending') pending.add(req.folderId);
      }
      setApprovedFolderIds(approved);
      setPendingFolderIds(pending);
    } catch {
      // silently ignore — not critical
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const requestAccess = async (folderId: string, folderName: string) => {
    await requestFolderAccess(folderId, folderName);
    setPendingFolderIds((prev) => new Set([...prev, folderId]));
  };

  return (
    <FolderAccessContext.Provider value={{ approvedFolderIds, pendingFolderIds, requestAccess, refresh: load }}>
      {children}
    </FolderAccessContext.Provider>
  );
}

export function useFolderAccess() {
  return useContext(FolderAccessContext);
}
