export const DEFAULT_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = ["en", "km"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  km: "ខ្មែរ",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  km: "🇰🇭",
};

export const LANGUAGE_STORAGE_KEY = "happy-birds-locale";

export function isValidLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale)
  );
}
