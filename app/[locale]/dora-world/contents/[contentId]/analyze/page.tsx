import { getContent, fetchBuildId } from '@/lib/dora-world';
import { BackButton } from '@/components/back-button';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import { TermAnalyzer } from '@/components/term-analyzer';
import { LoginForm } from '@/components/login-form';
import { checkAuth } from '@/lib/auth';
import remarkBreaks from 'remark-breaks';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export default async function ArticleAnalyzePage({ params }: PageProps) {
  const { contentId } = await params;
  const isAuthenticated = await checkAuth();

  const nextBuildId = await fetchBuildId();
  const markdown = await getContent({
    nextBuildId,
    contentId: Number(contentId),
  });

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
