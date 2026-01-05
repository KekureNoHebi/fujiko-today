import { TranslateTool } from '@/components/translation/translate-tool';
import type { LanguageCode } from '@/lib/types/term';
import type { Metadata } from 'next';
import { getGT } from 'gt-next/server';
import { generatePageMetadata } from '@/lib/utils/metadata';

interface TranslateToolPageProps {
  params: Promise<{
    locale: LanguageCode;
  }>;
}

export async function generateMetadata({
  params,
}: TranslateToolPageProps): Promise<Metadata> {
  const t = await getGT();
  const { locale } = await params;

  const metaTitle = t('Translation Tool');

  return generatePageMetadata({
    title: metaTitle,
    description: metaTitle,
    locale,
    path: '/translate',
    type: 'website',
  });
}

export default async function TranslateToolPage({
  params,
}: TranslateToolPageProps) {
  const { locale } = await params;

  return <TranslateTool locale={locale} />;
}
