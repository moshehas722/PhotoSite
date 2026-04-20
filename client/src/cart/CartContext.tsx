import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Photo } from '../types';
import { useAuth } from '../auth/AuthContext';

interface CartContextValue {
  items: Photo[];
  add: (photo: Photo) => void;
  remove: (photoId: string) => void;
  clear: () => void;
  has: (photoId: string) => boolean;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'photosite.cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Photo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Photo[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const { user } = useAuth();
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
    }
    prevUserRef.current = user;
  }, [user]);

  const add = (photo: Photo) => {
    setItems((prev) => (prev.some((p) => p.id === photo.id) ? prev : [...prev, photo]));
  };

  const remove = (photoId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== photoId));
  };

  const clear = () => setItems([]);
  const has = (photoId: string) => items.some((p) => p.id === photoId);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
