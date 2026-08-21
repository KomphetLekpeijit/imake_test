'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language } from './i18n';
import translations from './i18n';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('th');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('lang') as Language;
    if (saved && (saved === 'th' || saved === 'en')) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback(
    (path: string): string => {
      const keys = path.split('.');
      let result: any = translations[lang];
      for (const key of keys) {
        result = result?.[key];
      }
      return result || path;
    },
    [lang],
  );

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: 'th' as Language,
      setLang: () => {},
      t: (path: string) => path,
    };
  }
  return context;
}
