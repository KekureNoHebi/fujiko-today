'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { T } from 'gt-next';

interface BackToListProps {
  locale: string;
  fallbackPath?: string;
}

interface NavigationState {
  topic: string;
  topicId?: string;
  page: number;
}

export function BackToList({
  locale,
  fallbackPath = '/dora-world/contents',
}: BackToListProps) {
  // Lazy initialization: only runs once on client mount
  const [backUrl] = useState(() => {
    // Server-side or initial render
    if (typeof window === 'undefined') {
      return `/${locale}${fallbackPath}`;
    }

    try {
      const saved = sessionStorage.getItem('dora_nav_state');
      if (!saved) {
        return `/${locale}${fallbackPath}`;
      }

      const state: NavigationState = JSON.parse(saved);
      const { topic, topicId, page } = state;
      const params = new URLSearchParams();

      if (topicId) {
        params.set('t', topicId);
      }

      if (page > 1) {
        params.set('page', page.toString());
      }

      const query = params.toString();
      return `/${locale}/dora-world/${topic}${query ? `?${query}` : ''}`;
    } catch {
      return `/${locale}${fallbackPath}`;
    }
  });

  return (
    <Link
      href={backUrl}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <T>Back to List</T>
    </Link>
  );
}
