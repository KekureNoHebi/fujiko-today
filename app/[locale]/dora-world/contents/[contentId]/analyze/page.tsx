import { getContent, fetchBuildId } from '@/lib/services/dora-world';
import ReactMarkdown from 'react-markdown';
import { TermAnalyzer } from '@/components/term-analyzer';
import { LoginForm } from '@/components/login-form';
import { checkAuth } from '@/lib/auth';
import remarkBreaks from 'remark-breaks';
import { BackToList } from '@/components/back-to-list';
import { markdownComponents } from '@/lib/markdown-components';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export default async function ArticleAnalyzePage({ params }: PageProps) {
  const { contentId, locale } = await params;
  const isAuthenticated = await checkAuth();

  const nextBuildId = await fetchBuildId();
  const markdown = await getContent({
    nextBuildId,
    contentId: Number(contentId),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[min(65ch,calc(100vw-2rem))] sm:max-w-[min(70ch,calc(100vw-3rem))] lg:max-w-[min(75ch,calc(100vw-4rem))]">
        <BackToList locale={locale} basePath="dora-world/contents" />
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
