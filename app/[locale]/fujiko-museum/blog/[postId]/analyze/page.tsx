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

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
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
      <div className="mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[min(65ch,90vw)] lg:max-w-[min(75ch,70vw)] xl:max-w-[min(80ch,60vw)]">
        <BackToList locale={locale} basePath="fujiko-museum/blog" />
        <article className="mt-4 sm:mt-6 md:mt-8">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkBreaks]}
          >
            {markdown}
          </ReactMarkdown>
        </article>
        <div className="mt-12 pt-8 border-t border-border">
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
