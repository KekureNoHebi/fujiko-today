import { TranslateTool } from '@/components/translation/translate-tool';
import type { LanguageCode } from '@/lib/types/term';

interface TranslateToolPageProps {
  params: Promise<{
    locale: LanguageCode;
  }>;
}

export default async function TranslateToolPage({
  params,
}: TranslateToolPageProps) {
  const { locale } = await params;

  return <TranslateTool locale={locale} />;
}
