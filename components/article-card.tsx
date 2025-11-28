import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Link href={href} className="group">
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 pt-0',
          className,
        )}
      >
        <div className="aspect-143/93 relative overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg leading-snug group-hover:text-primary transition-colors duration-200">
            {title}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
