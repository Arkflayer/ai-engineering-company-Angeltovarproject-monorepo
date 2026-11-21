'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'es' | 'en';

type LangContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextType>({
  lang: 'es',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');
  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);
  return (
    <LangContext.Provider value={{ lang, setLang: toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

export const COMMON_LOCALE: Record<string, { es: string; en: string }> = {
  loading:          { es: "Cargando…", en: "Loading…" },
  retry:            { es: "Reintentar", en: "Retry" },
  save:             { es: "Guardar", en: "Save" },
  cancel:           { es: "Cancelar", en: "Cancel" },
};