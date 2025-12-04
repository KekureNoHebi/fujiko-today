import { fetchPostsFromDirectus } from '@/lib/services/fujiko-museum';
import { ArticleCard } from '@/components/article-card';
import { Pagination } from '@/components/pagination';
import { T } from 'gt-next';
import { checkAuth } from '@/lib/auth';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function FujikoMuseumListPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const isLoggedIn = await checkAuth();
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const result = await fetchPostsFromDirectus({
    locale,
    page: currentPage,
    limit: 30,
  });

  const basePath = `/${locale}/fujiko-museum/blog`;

  const navigationState = {
    page: currentPage,
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Kawasaki City Fujiko・F・Fujio Museum
          </h1>
        </header>

        {result.contents.length === 0 ? (
          <p className="text-muted-foreground py-12">
            <T>No articles found</T>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {result.contents.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  imageUrl={article.image_url}
                  isLoggedIn={isLoggedIn}
                  navigationState={navigationState}
                  aspectRatio="aspect-16/11"
                  basePath={basePath}
                />
              ))}
            </div>

            {result.meta.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={result.meta.totalPages}
                basePath={basePath}
                searchParams={{}}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
