import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  id: number;
  title: string;
  imageUrl: string;
  className?: string;
  isLoggedIn?: boolean;
}

export function ArticleCard({
  id,
  title,
  imageUrl,
  className,
  isLoggedIn = false,
}: ArticleCardProps) {
  const href = isLoggedIn
    ? `/dora-world/contents/${id}/analyze`
    : `/dora-world/contents/${id}`;

  return (
    <Link href={href} className={cn('block group', className)}>
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
    </Link>
  );
}
