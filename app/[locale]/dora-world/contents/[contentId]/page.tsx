import {
  getContentWithFallback,
  fetchBuildId,
} from '@/lib/services/dora-world';
import { BackButton } from '@/components/back-button';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import remarkBreaks from 'remark-breaks';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';

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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <BackButton />

        <article className="mt-8">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkBreaks]}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
