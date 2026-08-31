export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "hi", "ja", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: Locale[] = ["ar"];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export const LOCALE_NAMES: Record<Locale, { name: string; nativeName: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", nativeName: "English", dir: "ltr" },
  es: { name: "Spanish", nativeName: "Español", dir: "ltr" },
  fr: { name: "French", nativeName: "Français", dir: "ltr" },
  de: { name: "German", nativeName: "Deutsch", dir: "ltr" },
  hi: { name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  ja: { name: "Japanese", nativeName: "日本語", dir: "ltr" },
  ar: { name: "Arabic", nativeName: "العربية", dir: "rtl" },
};
