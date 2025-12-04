'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { T } from 'gt-next';
import { getNavStorageKey } from '@/lib/utils/navigation-storage';

interface BackToListProps {
  locale: string;
  basePath: string;
}

type NavigationState = Record<string, string | number>;

function getBackUrl(locale: string, basePath: string): string {
  const baseUrl = `/${locale}/${basePath}`;

  try {
    const storageKey = getNavStorageKey(basePath);
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) {
      return baseUrl;
    }

    const state: NavigationState = JSON.parse(saved);
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(state)) {
      params.set(key, value.toString());
    }

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  } catch {
    return baseUrl;
  }
}

export function BackToList({ locale, basePath }: BackToListProps) {
  const baseUrl = `/${locale}/${basePath}`;

  const backUrl = useSyncExternalStore(
    () => () => {},
    () => getBackUrl(locale, basePath),
    () => baseUrl,
  );

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
