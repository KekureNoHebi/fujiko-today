'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { T } from 'gt-next';
import { getNavStorageKey } from '@/lib/utils/navigation-storage';

interface BackToListProps {
  locale: string;
  basePath: string;
}

type NavigationState = Record<string, string | number>;

export function BackToList({ locale, basePath }: BackToListProps) {
  const [backUrl] = useState(() => {
    if (typeof window === 'undefined') {
      return `/${locale}/${basePath}`;
    }

    try {
      const storageKey = getNavStorageKey(basePath);
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) {
        return `/${locale}/${basePath}`;
      }

      const state: NavigationState = JSON.parse(saved);
      const params = new URLSearchParams();

      // Build query params from state
      for (const [key, value] of Object.entries(state)) {
        params.set(key, value.toString());
      }

      const query = params.toString();
      return `/${locale}/${basePath}${query ? `?${query}` : ''}`;
    } catch {
      return `/${locale}/${basePath}`;
    }
  });

  return (
    <Link
      href={backUrl}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mt-2 sm:mt-3"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <T>Back</T>
    </Link>
  );
}
