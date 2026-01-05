import type { Metadata } from 'next';
import { LANGUAGE_CODES } from '@/lib/types/term';

const SITE_NAME = 'Fujiko Today';
const DEFAULT_LOCALE = 'en';
const LOCALES = LANGUAGE_CODES;

interface MetadataParams {
  title: string;
  description: string;
  locale: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export function generateAlternateLanguages(
  path: string,
  currentLocale: string,
): Metadata['alternates'] {
  const languages: Record<string, string> = {};

  LOCALES.forEach((locale) => {
    const localePath = locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
    languages[locale] = localePath;
  });

  languages['x-default'] =
    currentLocale === DEFAULT_LOCALE ? path : `/${currentLocale}${path}`;

  return { languages };
}

export function generatePageMetadata({
  title,
  description,
  locale,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
}: MetadataParams): Metadata {
  const alternates = generateAlternateLanguages(path, locale);

  const metadata: Metadata = {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type,
      siteName: SITE_NAME,
      locale: locale.replace('-', '_'),
      ...(image && { images: [{ url: image }] }),
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };

  return metadata;
}

export function getDefaultOGImage(): string {
  return '/og-image';
}
