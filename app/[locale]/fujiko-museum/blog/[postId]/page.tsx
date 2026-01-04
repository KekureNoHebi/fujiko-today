import {
  getPostWithFallback,
  fetchPostTitle,
} from '@/lib/services/fujiko-museum';
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
    postId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getGT();
  const { postId, locale } = await params;

  const title = await fetchPostTitle({
    postId: Number(postId),
    locale,
  });

  const { markdown } = await getPostWithFallback({
    postId: Number(postId),
    locale,
  });

  // Extract description from markdown content
  const description = extractDescriptionFromMarkdown(markdown);
  const metaTitle = t('{title} — Fujiko・F・Fujio Museum', { title });

  return {
    title: metaTitle,
    description,
    openGraph: {
      title: metaTitle,
      description,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId, locale } = await params;

  const { markdown, translationRequests } = await getPostWithFallback({
    postId: Number(postId),
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
      ? `/api/contents?locale=${locale}&path=/fujiko-museum/blog/${postId}/${locale}/content.md`
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
        <article className="mt-3 sm:mt-4 md:mt-6">
          <ArticleContent initialMarkdown={markdown} apiUrl={apiUrl} />
        </article>
      </div>
    </div>
  );
}
