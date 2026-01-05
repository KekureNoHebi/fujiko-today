import { TermsManager } from '@/components/term/terms-manager';
import type { LanguageCode } from '@/lib/types/term';
import type { Metadata } from 'next';
import { getGT } from 'gt-next/server';
import { generatePageMetadata } from '@/lib/utils/metadata';

interface TermsPageProps {
  params: Promise<{
    locale: LanguageCode;
  }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const t = await getGT();
  const { locale } = await params;

  const metaTitle = t('Terms Management');

  return generatePageMetadata({
    title: metaTitle,
    description: metaTitle,
    locale,
    path: '/terms',
    type: 'website',
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  return <TermsManager locale={locale} />;
}
