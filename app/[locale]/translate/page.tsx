import { TranslateTool } from '@/components/translate-tool/translate-tool';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <TranslateTool locale={locale} />
      </div>
    </div>
  );
}
