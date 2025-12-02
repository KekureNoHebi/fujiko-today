import { getContent, fetchBuildId } from '@/lib/services/dora-world';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import { TermAnalyzer } from '@/components/term-analyzer';
import { LoginForm } from '@/components/login-form';
import { checkAuth } from '@/lib/auth';
import remarkBreaks from 'remark-breaks';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { T } from 'gt-next';

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
        <Link
          href={`/dora-world/contents`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <T>Back to List</T>
        </Link>
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
