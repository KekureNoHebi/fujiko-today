import { getPost, fetchPostMetadata } from '@/lib/services/fujiko-museum';
import { BackToList } from '@/components/navigation/back-to-list';
import { TermAnalyzer } from '@/components/term/term-analyzer';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import remarkBreaks from 'remark-breaks';
import { TranslationComparison } from '@/components/translation/translation-comparison';
import { LanguageCode } from '@/lib/types/term';
import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/utils/metadata';

interface PageProps {
  params: Promise<{
    locale: string;
    postId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId, locale } = await params;

  const metadata = await fetchPostMetadata({
    postId: Number(postId),
    locale,
  });

  return {
    ...generatePageMetadata({
      title: metadata.title,
      description: metadata.title,
      locale,
      path: `/fujiko-museum/blog/${postId}/analyze`,
      type: 'article',
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId, locale } = await params;

  const markdown = await getPost({
    postId: Number(postId),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
        <article className="mt-3 sm:mt-4 md:mt-6">
          <ReactMarkdown
            components={{
              ...markdownComponents,
              img: () => <></>,
            }}
            remarkPlugins={[remarkBreaks]}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
      <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-border">
        <TermAnalyzer
          content={markdown}
          targetLanguage={locale as LanguageCode}
        />
        <div className="mt-4">
          <TranslationComparison
            content={markdown}
            targetLanguage={locale as LanguageCode}
          />
        </div>
      </div>
    </div>
  );
}
