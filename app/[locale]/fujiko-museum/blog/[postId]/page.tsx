import { getPostWithFallback } from '@/lib/services/fujiko-museum';
import { ArticleContent } from '@/components/article/article-content';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import { BackToList } from '@/components/navigation/back-to-list';

interface PageProps {
  params: Promise<{
    locale: string;
    postId: string;
  }>;
}

export const revalidate = false;

export async function generateStaticParams() {
  return [];
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
    translationRequests && translationRequests.length > 0
      ? `/api/contents?locale=${locale}&path=/fujiko-today/fujiko-museum/blog/${postId}/${locale}/content.md`
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
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
