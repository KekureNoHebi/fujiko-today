import { getContent, fetchBuildId } from '@/lib/dora-world';
import { BackButton } from '@/components/back-button';
import ReactMarkdown, { Components } from 'react-markdown';
import Image from 'next/image';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold tracking-tight mb-6 mt-2 first:mt-0 text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold tracking-tight mt-10 mb-4 pb-2 border-b border-border/50 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold mt-8 mb-3 text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="leading-7 text-foreground/90 mb-4 not-first:mt-4">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;
    return (
      <span className="block my-6">
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={450}
          className="rounded-sm shadow-lg border border-border/50 w-full h-auto"
          unoptimized
        />
        {alt && (
          <span className="block text-center text-sm text-muted-foreground mt-3">
            {alt}
          </span>
        )}
      </span>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-primary bg-muted/50 py-4 px-6 rounded-r-lg italic text-foreground/80">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc space-y-2 marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-muted border border-border p-4 text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 overflow-hidden rounded-lg">{children}</pre>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50 border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-t border-border/50">{children}</td>
  ),
};

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
  const { contentId } = await params;

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
          <ReactMarkdown components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
