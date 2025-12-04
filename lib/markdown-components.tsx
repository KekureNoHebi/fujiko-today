import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 sm:mb-6 mt-2 first:mt-0 text-foreground leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mt-8 sm:mt-10 md:mt-12 mb-3 sm:mb-4 pb-2 border-b border-border/50 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mt-6 sm:mt-8 mb-2 sm:mb-3 text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base sm:text-lg leading-relaxed sm:leading-8 text-foreground/90 mb-4 sm:mb-5 not-first:mt-4">
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
      <span className="block my-6 sm:my-8">
        <img
          src={src}
          alt={alt || ''}
          className="rounded-sm max-w-full h-auto mx-auto"
          loading="lazy"
        />
      </span>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-5 sm:my-6 border-l-4 border-primary bg-muted/50 py-3 sm:py-4 px-4 sm:px-6 rounded-r-lg italic text-foreground/80 text-base sm:text-lg">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-4 sm:my-5 ml-5 sm:ml-6 list-disc space-y-2 sm:space-y-3 marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 sm:my-5 ml-5 sm:ml-6 list-decimal space-y-2 sm:space-y-3 marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-base sm:text-lg leading-relaxed sm:leading-8">
      {children}
    </li>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-muted border border-border p-3 sm:p-4 text-xs sm:text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-muted px-1 sm:px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-5 sm:my-6 overflow-hidden rounded-lg">{children}</pre>
  ),
  hr: () => <hr className="my-6 sm:my-8 border-border" />,
  table: ({ children }) => (
    <div className="my-5 sm:my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50 border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-foreground whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border/50">
      {children}
    </td>
  ),
};
