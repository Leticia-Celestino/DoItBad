export const locales = ['pt-br', 'en', 'es', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-br';
export const publishedLocales: readonly Locale[] = locales;

export const localeLabels: Record<Locale, string> = {
  'pt-br': 'PT',
  en: 'EN',
  es: 'ES',
  de: 'DE',
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
