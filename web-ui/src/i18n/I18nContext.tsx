import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Locale } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof translations)[Locale];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'pensieve-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or browser language
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'en' || stored === 'zh_Hant')) {
      return stored;
    }

    // Detect browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh_Hant';
    }
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Update HTML lang attribute
    document.documentElement.lang = newLocale === 'zh_Hant' ? 'zh-Hant' : 'en';
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale === 'zh_Hant' ? 'zh-Hant' : 'en';
  }, []);

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
