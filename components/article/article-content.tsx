'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/lib/markdown-components';
import remarkBreaks from 'remark-breaks';

interface ArticleContentProps {
  initialMarkdown: string;
  apiUrl?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ArticleContent({
  initialMarkdown,
  apiUrl,
}: ArticleContentProps) {
  const [animateTransition, setAnimateTransition] = useState<boolean | null>(
    null,
  );

  const { data } = useSWR<{ exists: boolean; markdown?: string }>(
    apiUrl ? apiUrl : null,
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
