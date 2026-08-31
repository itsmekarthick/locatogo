"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import enDict from "./translations/en.json";
import { DEFAULT_LOCALE, type Locale, isRTL } from "./config";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRtl: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

function lookupKey(dict: any, key: string): string {
  const parts = key.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return key;
    }
  }
  return typeof current === "string" ? current : key;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.entries(params).reduce((str, [pKey, pVal]) => {
    return str.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
  }, text);
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRTL(newLocale) ? "rtl" : "ltr";
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const text = lookupKey(enDict, key);
      return interpolate(text, params);
    },
    []
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      isRtl: isRTL(locale),
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      isRtl: false,
      t: (key: string, params?: Record<string, string | number>) => {
        const text = lookupKey(enDict, key);
        return interpolate(text, params);
      },
    };
  }
  return ctx;
}
