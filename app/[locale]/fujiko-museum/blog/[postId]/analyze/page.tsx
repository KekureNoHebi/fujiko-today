import { getPostWithFallback } from '@/lib/services/fujiko-museum';
import { triggerContentTranslationAction } from '@/lib/actions/translate';
import { after } from 'next/server';
import { BackToList } from '@/components/back-to-list';
import { TermAnalyzer } from '@/components/term-analyzer';
import { LoginForm } from '@/components/login-form';
import { checkAuth } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import remarkBreaks from 'remark-breaks';

interface PageProps {
  params: Promise<{
    locale: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId, locale } = await params;
  const isAuthenticated = await checkAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
        <article className="mt-3 sm:mt-4 md:mt-6">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkBreaks]}
          >
            {markdown}
          </ReactMarkdown>
        </article>
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-border">
          {isAuthenticated ? (
            <TermAnalyzer content={markdown} />
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </div>
  );
}
