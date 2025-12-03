'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavStorageKey } from '@/lib/utils/navigation-storage';

interface ArticleCardProps {
  id: number;
  title: string;
  imageUrl?: string;
  basePath: string;
  className?: string;
  isLoggedIn?: boolean;
  pageUrl?: string;
  navigationState?: Record<string, string | number>;
  aspectRatio?: string;
}

export function ArticleCard({
  id,
  title,
  imageUrl,
  basePath,
  className,
  isLoggedIn = false,
  pageUrl,
  navigationState,
  aspectRatio,
}: ArticleCardProps) {
  const isExternalUrl = pageUrl?.startsWith('http');

  const href = isExternalUrl
    ? pageUrl
    : isLoggedIn
      ? `${basePath}/${id}/analyze`
      : `${basePath}/${id}`;

  const handleClick = () => {
    if (!isExternalUrl && navigationState) {
      try {
        const storageKey = getNavStorageKey(basePath);
        sessionStorage.setItem(storageKey, JSON.stringify(navigationState));
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
    }
  };

  const cardContent = (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-muted',
          aspectRatio || 'aspect-29/19',
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-12 h-12 text-muted-foreground opacity-40" />
          </div>
        )}
      </div>
      <h3 className="mt-3 text-sm md:text-base font-medium group-hover:text-primary transition-colors">
        {title}
      </h3>
    </>
  );

  if (isExternalUrl) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('block group', className)}
        onClick={handleClick}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      href={href!}
      className={cn('block group', className)}
      onClick={handleClick}
    >
      {cardContent}
    </Link>
  );
}
