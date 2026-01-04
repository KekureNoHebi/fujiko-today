import {
  getContentWithFallback,
  fetchBuildId,
  fetchContentTitle,
} from '@/lib/services/dora-world';
import { ArticleContent } from '@/components/article/article-content';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import { BackToList } from '@/components/navigation/back-to-list';
import type { Metadata } from 'next';
import { getGT } from 'gt-next/server';
import { extractDescriptionFromMarkdown } from '@/lib/utils/content-helpers';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getGT();
  const { contentId, locale } = await params;

  const title = await fetchContentTitle({
    contentId: Number(contentId),
    locale,
  });

  const nextBuildId = await fetchBuildId();
  const { markdown } = await getContentWithFallback({
    nextBuildId,
    contentId: Number(contentId),
    locale,
  });

  // Extract description from markdown content
  const description = extractDescriptionFromMarkdown(markdown);
  const metaTitle = t('{title} — Doraemon Channel', { title });

  return {
    title: metaTitle,
    description,
    openGraph: {
      title: metaTitle,
      description,
    },
  };
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
    translationRequests && translationRequests.length > 0 && locale !== 'ja'
      ? `/api/contents?locale=${locale}&path=/dora-world/contents/${contentId}/${locale}/content.md`
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="dora-world/contents" />
        <article className="mt-3 sm:mt-4 md:mt-6">
          <ArticleContent initialMarkdown={markdown} apiUrl={apiUrl} />
        </article>
      </div>
    </div>
  );
}
