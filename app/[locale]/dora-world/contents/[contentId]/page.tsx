import {
  getContentWithFallback,
  fetchBuildId,
} from '@/lib/services/dora-world';
import { ArticleContent } from '@/components/article-content';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import { BackToList } from '@/components/back-to-list';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export const revalidate = false;

export async function generateStaticParams() {
  return [];
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { contentId, locale } = await params;

  const nextBuildId = await fetchBuildId();
  const { markdown, translationRequests } = await getContentWithFallback({
    nextBuildId,
    contentId: Number(contentId),
    locale,
  });

  if (translationRequests) {
    after(async () => {
      await Promise.all(
        translationRequests.map((translationRequest) =>
          triggerContentTranslationAction(translationRequest),
        ),
      );
    });
  }

  const apiUrl =
    translationRequests && translationRequests.length > 0
      ? `/api/contents?locale=${locale}&path=/fujiko-today/dora-world/contents/${contentId}/${locale}/content.md`
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="dora-world/contents" />
        <article className="mt-3 sm:mt-4 md:mt-6">
          <ArticleContent
            locale={locale}
            initialMarkdown={markdown}
            apiUrl={apiUrl}
          />
        </article>
      </div>
    </div>
  );
}
