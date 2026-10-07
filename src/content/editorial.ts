import { articlesByLocale, type Article } from './articles';
import type { Locale } from '../i18n/config';

type SanityArticle = Omit<Article, 'readingTime' | 'paragraphs'> & {
  body?: Array<{ children?: Array<{ text?: string }> }>;
};

const categoryLabels: Record<Locale, Record<string, string>> = {
  'pt-br': { começar: 'Começar', retomar: 'Retomar', cotidiano: 'Cotidiano' },
  en: { começar: 'Starting', retomar: 'Returning', cotidiano: 'Everyday life' },
  es: { começar: 'Empezar', retomar: 'Retomar', cotidiano: 'Cotidiano' },
  de: { começar: 'Anfangen', retomar: 'Zurückkehren', cotidiano: 'Alltag' },
};
const readingLabels: Record<Locale, (minutes: number) => string> = {
  'pt-br': (minutes) => `${minutes} min de leitura`,
  en: (minutes) => `${minutes} min read`,
  es: (minutes) => `${minutes} min de lectura`,
  de: (minutes) => `${minutes} Min. Lesezeit`,
};

function readingTime(locale: Locale, paragraphs: string[]) {
  const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return readingLabels[locale](Math.max(1, Math.ceil(words / 200)));
}

function optimizedCoverUrl(source: string) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'cdn.sanity.io') return source;
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'max');
    url.searchParams.set('w', '1280');
    return url.href;
  } catch {
    return source;
  }
}

async function fetchSanityArticles(locale: Locale): Promise<Article[] | null> {
  const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID?.trim() || 'xqfqfioy';
  const dataset = import.meta.env.PUBLIC_SANITY_DATASET?.trim() || 'production';
  const preview = import.meta.env.SANITY_PREVIEW === 'true';
  const readToken = import.meta.env.SANITY_API_READ_TOKEN?.trim();
  if (preview && !readToken) {
    throw new Error('SANITY_PREVIEW exige SANITY_API_READ_TOKEN.');
  }

  const query = `*[_type == "article" && language == $locale && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) {
    translationKey, "slug": slug.current, title, summary, category,
    "author": author->name, "publishedAt": string::split(publishedAt, "T")[0],
    "reviewedAt": string::split(coalesce(reviewedAt, publishedAt), "T")[0],
    "cover": { "src": cover.asset->url, "alt": cover.alt }, body, "action": practicalAction
  }`;
  const url = new URL(`https://${projectId}.api.sanity.io/v2026-03-01/data/query/${dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('$locale', JSON.stringify(locale));
  url.searchParams.set('perspective', preview ? 'drafts' : 'published');

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: readToken ? { Authorization: `Bearer ${readToken}` } : undefined,
    });
    if (!response.ok) throw new Error(`Sanity returned ${response.status}`);
    const payload = (await response.json()) as { result?: SanityArticle[] };
    if (!payload.result?.length) return null;
    return payload.result.map((item) => {
      const paragraphs = (item.body ?? [])
        .map((block) => (block.children ?? []).map((child) => child.text ?? '').join(''))
        .filter(Boolean);
      return {
        ...item,
        cover: { ...item.cover, src: optimizedCoverUrl(item.cover.src) },
        category: categoryLabels[locale][item.category] ?? item.category,
        paragraphs,
        readingTime: readingTime(locale, paragraphs),
      };
    });
  } catch (error) {
    console.warn('Sanity indisponível; usando conteúdo editorial versionado.', error);
    return null;
  }
}

export async function getArticles(locale: Locale) {
  return (await fetchSanityArticles(locale)) ?? articlesByLocale[locale];
}

export async function getEditorialCatalog() {
  const entries = await Promise.all(
    (Object.keys(articlesByLocale) as Locale[]).map(
      async (locale) => [locale, await getArticles(locale)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<Locale, Article[]>;
}
