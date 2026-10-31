import { en, type Dictionary } from "@/content/i18n/en";

/**
 * Minimal i18n layer. Default locale is en-KE. To add Swahili, create
 * content/i18n/sw.ts exporting a `Dictionary` and register it below.
 */
const dictionaries: Record<string, Dictionary> = { en };

export const defaultLocale = "en";

export function getDictionary(locale: string = defaultLocale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Shorthand for the default dictionary. */
export const t = getDictionary();
