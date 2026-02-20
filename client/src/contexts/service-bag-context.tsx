import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface BagItem {
  serviceId: string;
  serviceName: string;
  price: string;
  estimatedPrice?: number;
  notes?: string;
  addedAt: string;
}

interface ServiceBagContextType {
  items: BagItem[];
  addItem: (item: BagItem) => void;
  removeItem: (serviceId: string) => void;
  clearBag: () => void;
  itemCount: number;
  isInBag: (serviceId: string) => boolean;
}

const STORAGE_KEY = "uptend-service-bag";

const ServiceBagContext = createContext<ServiceBagContextType | null>(null);

function loadBag(): BagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ServiceBagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>(loadBag);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: BagItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.serviceId === item.serviceId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => prev.filter((i) => i.serviceId !== serviceId));
  }, []);

  const clearBag = useCallback(() => setItems([]), []);

  const isInBag = useCallback(
    (serviceId: string) => items.some((i) => i.serviceId === serviceId),
    [items],
  );

  return (
    <ServiceBagContext.Provider
      value={{ items, addItem, removeItem, clearBag, itemCount: items.length, isInBag }}
    >
      {children}
    </ServiceBagContext.Provider>
  );
}

export function useServiceBag() {
  const ctx = useContext(ServiceBagContext);
  if (!ctx) throw new Error("useServiceBag must be used within ServiceBagProvider");
  return ctx;
}
