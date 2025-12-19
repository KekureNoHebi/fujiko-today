import { TermsManager } from '@/components/term/terms-manager';
import type { LanguageCode } from '@/lib/types/term';

interface TermsPageProps {
  params: Promise<{
    locale: LanguageCode;
  }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  return <TermsManager locale={locale} />;
}
