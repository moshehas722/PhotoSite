import { createContext, useContext, useEffect, useState } from 'react';

interface SiteConfig {
  cartEnabled: boolean;
}

interface SiteConfigContextValue extends SiteConfig {
  setCartEnabled: (enabled: boolean) => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  cartEnabled: true,
  setCartEnabled: () => {},
});

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [cartEnabled, setCartEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data: SiteConfig) => {
        setCartEnabled(data.cartEnabled);
      })
      .catch(() => {});
  }, []);

  return (
    <SiteConfigContext.Provider value={{ cartEnabled, setCartEnabled }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
