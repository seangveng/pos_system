"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import enMessages from "@/messages/en.json";
import kmMessages from "@/messages/km.json";

import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";

// ======================================================
// TYPES
// ======================================================

type Messages = typeof enMessages;

interface LanguageContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  isReady: boolean;
}

interface LanguageProviderProps {
  children: ReactNode;
}

// ======================================================
// LANGUAGE CONTEXT
// ======================================================

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// ======================================================
// LANGUAGE PROVIDER
// ======================================================

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  // ====================================================
  // RESTORE SAVED LANGUAGE
  // ====================================================

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (isValidLocale(savedLocale)) {
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.error("Unable to restore language preference:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // ====================================================
  // UPDATE HTML LANGUAGE
  // ====================================================

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // ====================================================
  // CHANGE LANGUAGE
  // ====================================================

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!isValidLocale(nextLocale)) {
      return;
    }

    setLocaleState(nextLocale);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
    } catch (error) {
      console.error("Unable to save language preference:", error);
    }
  }, []);

  // ====================================================
  // SELECT TRANSLATION DICTIONARY
  // ====================================================

  const messages = useMemo<Messages>(() => {
    return locale === "km" ? kmMessages : enMessages;
  }, [locale]);

  // ====================================================
  // CONTEXT VALUE
  // ====================================================

  const value = useMemo<LanguageContextType>(
    () => ({
      locale,
      messages,
      setLocale,
      isReady,
    }),
    [locale, messages, setLocale, isReady],
  );

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ======================================================
// USE LANGUAGE HOOK
// ======================================================

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
