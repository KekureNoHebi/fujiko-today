import {
  getContentWithFallback,
  fetchBuildId,
} from '@/lib/services/dora-world';
import { ArticleContent } from '@/components/article-content';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { T } from 'gt-next';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export const revalidate = 3600;

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

  const needsTranslation =
    !!translationRequests && translationRequests.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[min(65ch,90vw)] lg:max-w-[min(75ch,70vw)] xl:max-w-[min(80ch,60vw)]">
        <Link
          href={`/dora-world/contents`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <T>Back to List</T>
        </Link>
        <article className="mt-4 sm:mt-6 md:mt-8">
          <ArticleContent
            contentId={contentId}
            locale={locale}
            initialMarkdown={markdown}
            needsTranslation={needsTranslation}
          />
        </article>
      </div>
    </div>
  );
}
