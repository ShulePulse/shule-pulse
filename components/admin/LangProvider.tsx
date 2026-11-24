'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type I18nKey, type Lang } from '@/lib/i18n';

type Ctx = { lang: Lang; setLang: (lang: Lang) => void; t: (key: I18nKey) => string };

const LangContext = createContext<Ctx>({ lang: 'sw', setLang: () => undefined, t: (key) => translate('sw', key) });

/** Kiswahili / English toggle for the admin area (remembered in localStorage). */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sw');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('sp-lang');
      if (saved === 'sw' || saved === 'en') setLangState(saved);
    } catch {
      // storage unavailable: keep default
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem('sp-lang', next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (key) => translate(lang, key) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  return useContext(LangContext);
}

/** Inline translated text for server components: <T k="nav.students" /> */
export function T({ k }: { k: I18nKey }) {
  const { t } = useT();
  return <>{t(k)}</>;
}
