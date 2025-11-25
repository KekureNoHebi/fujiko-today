import { getContent, fetchBuildId } from '@/lib/dora-world';
import { BackButton } from '@/components/back-button';
import ReactMarkdown from 'react-markdown';

interface PageProps {
  params: Promise<{
    locale: string;
    contentId: string;
  }>;
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { contentId } = await params;

  const buildId = await fetchBuildId();
  const markdown = await getContent(buildId, Number(contentId));

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <BackButton />

      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
