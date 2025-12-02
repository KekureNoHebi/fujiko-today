'use client';

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
  const { data } = useSWR<{ exists: boolean; markdown?: string }>(
    needsTranslation
      ? `/api/dora-world/contents/${contentId}?locale=${locale}`
      : null,
    fetcher,
    {
      refreshInterval: (latestData) => (latestData?.exists ? 0 : 30000),
      revalidateOnFocus: false,
    },
  );

  const markdown =
    data?.exists && data.markdown ? data.markdown : initialMarkdown;

  return (
    <ReactMarkdown
      components={markdownComponents}
      remarkPlugins={[remarkBreaks]}
    >
      {markdown}
    </ReactMarkdown>
  );
}
