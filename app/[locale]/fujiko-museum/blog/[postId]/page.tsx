import { getPostWithFallback } from '@/lib/services/fujiko-museum';
import { ArticleContent } from '@/components/article-content';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import { BackToList } from '@/components/back-to-list';

interface PageProps {
  params: Promise<{
    locale: string;
    postId: string;
  }>;
}

export const revalidate = 3600;

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
      <div className="mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[min(65ch,90vw)] lg:max-w-[min(75ch,70vw)] xl:max-w-[min(80ch,60vw)]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
        <article className="mt-4 sm:mt-6 md:mt-8">
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
