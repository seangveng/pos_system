"use client";

import { useCallback, useContext } from "react";

import type { Locale } from "@/lib/i18n";
import { LanguageContext } from "@/contexts/language-context";

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function getNestedValue(
  dictionary: TranslationDictionary,
  key: string,
): string | undefined {
  const parts = key.split(".");

  let current: unknown = dictionary;

  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(message: string, params?: TranslationParams): string {
  if (!params) return message;

  return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = params[key];

    return value === null || value === undefined ? match : String(value);
  });
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useTranslation must be used inside LanguageProvider. Check app/layout.tsx.",
    );
  }

  const { locale, setLocale, messages } = context;

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const translation = getNestedValue(messages, key);

      if (translation !== undefined) {
        return interpolate(translation, params);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[i18n] Missing translation key: "${key}" for locale "${locale}"`,
        );
      }

      return interpolate(key, params);
    },
    [messages, locale],
  );

  return {
    t,
    locale,
    setLocale,
    isEnglish: locale === "en",
    isKhmer: locale === "km",
  };
}

export type { Locale, TranslationParams };
