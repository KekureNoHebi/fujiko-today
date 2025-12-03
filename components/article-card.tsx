'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  id: number;
  title: string;
  imageUrl: string;
  className?: string;
  isLoggedIn?: boolean;
  pageUrl?: string;
  navigationState?: {
    topic: string;
    topicId?: string;
    page: number;
  };
}

export function ArticleCard({
  id,
  title,
  imageUrl,
  className,
  isLoggedIn = false,
  pageUrl,
  navigationState,
}: ArticleCardProps) {
  const isExternalUrl = pageUrl?.startsWith('http');

  const href = isExternalUrl
    ? pageUrl
    : isLoggedIn
      ? `/dora-world/contents/${id}/analyze`
      : `/dora-world/contents/${id}`;

  const handleClick = () => {
    if (!isExternalUrl && navigationState) {
      try {
        sessionStorage.setItem(
          'dora_nav_state',
          JSON.stringify(navigationState),
        );
      } catch (error) {
        console.error('Failed to save navigation state:', error);
      }
    }
  };

  const cardContent = (
    <>
      <div className="relative aspect-29/19 overflow-hidden rounded-xl bg-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
