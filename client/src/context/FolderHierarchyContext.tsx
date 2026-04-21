import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ParentInfo {
  parentId: string;
  parentName: string;
}

interface FolderHierarchyContextValue {
  registerChildren: (parentId: string, parentName: string, children: { id: string }[]) => void;
  getParent: (folderId: string) => ParentInfo | null;
}

const FolderHierarchyContext = createContext<FolderHierarchyContextValue | null>(null);

export function FolderHierarchyProvider({ children }: { children: ReactNode }) {
  const [hierarchy, setHierarchy] = useState<Map<string, ParentInfo>>(new Map());

  const registerChildren = useCallback((parentId: string, parentName: string, childFolders: { id: string }[]) => {
    setHierarchy(prev => {
      const next = new Map(prev);
      for (const child of childFolders) {
        next.set(child.id, { parentId, parentName });
      }
      return next;
    });
  }, []);

  const getParent = useCallback((folderId: string) => {
    return hierarchy.get(folderId) ?? null;
  }, [hierarchy]);

  return (
    <FolderHierarchyContext.Provider value={{ registerChildren, getParent }}>
      {children}
    </FolderHierarchyContext.Provider>
  );
}

export function useFolderHierarchy() {
  const ctx = useContext(FolderHierarchyContext);
  if (!ctx) throw new Error('useFolderHierarchy must be used within FolderHierarchyProvider');
  return ctx;
}
