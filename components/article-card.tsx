import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  id: number;
  title: string;
  imageUrl: string;
  className?: string;
}

export function ArticleCard({
  id,
  title,
  imageUrl,
  className,
}: ArticleCardProps) {
  return (
    <Link href={`/dora-world/contents/${id}`}>
      <Card
        className={cn(
          'overflow-hidden transition-colors hover:bg-accent',
          className,
        )}
      >
        <div className="aspect-video relative overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
