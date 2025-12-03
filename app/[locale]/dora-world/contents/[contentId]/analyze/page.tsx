import { getContent, fetchBuildId } from '@/lib/services/dora-world';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import { TermAnalyzer } from '@/components/term-analyzer';
import { LoginForm } from '@/components/login-form';
import { checkAuth } from '@/lib/auth';
import remarkBreaks from 'remark-breaks';
import { BackToList } from '@/components/back-to-list';

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
      <div className="mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 w-full max-w-[min(65ch,90vw)] lg:max-w-[min(75ch,70vw)] xl:max-w-[min(80ch,60vw)]">
        <BackToList locale={locale} />
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
