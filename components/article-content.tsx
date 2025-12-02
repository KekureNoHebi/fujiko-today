'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import remarkBreaks from 'remark-breaks';

interface ArticleContentProps {
  contentId: string;
  locale: string;
  initialMarkdown: string;
  needsTranslation: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ArticleContent({
  contentId,
  locale,
  initialMarkdown,
  needsTranslation,
}: ArticleContentProps) {
  const [animateTransition, setAnimateTransition] = useState<boolean | null>(
    null,
  );

  const { data } = useSWR<{ exists: boolean; markdown?: string }>(
    needsTranslation
      ? `/api/dora-world/contents/${contentId}?locale=${locale}`
      : null,
    fetcher,
    {
      refreshInterval: (latestData) => (latestData?.exists ? 0 : 30000),
      revalidateOnFocus: false,
      onSuccess: (newData) => {
        if (animateTransition !== null) return;
        setAnimateTransition(!(newData?.exists && newData.markdown));
      },
    },
  );

  const isTranslationComplete = data?.exists && !!data.markdown;
  const markdown =
    data?.exists && data.markdown ? data.markdown : initialMarkdown;

  return (
    <div className="relative">
      {needsTranslation && !isTranslationComplete && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Translating...</span>
        </div>
      )}
      <div
        key={isTranslationComplete ? 'translated' : 'original'}
        className={
          animateTransition && isTranslationComplete
            ? 'animate-in fade-in duration-1000'
            : ''
        }
      >
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkBreaks]}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
