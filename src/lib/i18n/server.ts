import enDict from "./translations/en.json";
import { DEFAULT_LOCALE, type Locale } from "./config";

type TranslationDict = typeof enDict;

const dictionaries: Record<string, TranslationDict> = {
  en: enDict,
};

/**
 * Server-side translation lookup helper.
 * Supports dot-notation paths like "common.appName" or "admin.totalPlaces".
 * Supports token substitution like {count}.
 */
export function getTranslation(key: string, params?: Record<string, string | number>, locale: Locale = DEFAULT_LOCALE): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const parts = key.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // Fallback: search in English
      let fallback: any = dictionaries.en;
      for (const p of parts) {
        if (fallback && typeof fallback === "object" && p in fallback) {
          fallback = fallback[p];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== "string") return key;

  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    }, current);
  }

  return current;
}

export const t = getTranslation;
