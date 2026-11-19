"use client";

import { Languages, Check } from "lucide-react";

import { useLanguage } from "@/contexts/language-context";
import { LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { locale, setLocale, isReady } = useLanguage();

  const languages: Locale[] = ["en", "km"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isReady}
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          <span>{LOCALE_FLAGS[locale]}</span>
          <span>{LOCALE_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language}
            onClick={() => setLocale(language)}
            className="flex cursor-pointer items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2">
              <span>{LOCALE_FLAGS[language]}</span>
              <span>{LOCALE_LABELS[language]}</span>
            </span>

            {locale === language && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
