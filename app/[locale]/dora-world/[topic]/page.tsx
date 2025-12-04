import {
  fetchBuildId,
  fetchContents,
  fetchContentsFromDirectus,
} from '@/lib/services/dora-world';
import { ArticleCard } from '@/components/article/article-card';
import { Pagination } from '@/components/navigation/pagination';
import { T } from 'gt-next';
import { checkAuth } from '@/lib/auth';
import { PaginatedContentsResponse } from '@/lib/types/content';

interface PageProps {
  params: Promise<{
    locale: string;
    topic: string;
  }>;
  searchParams: Promise<{
    t?: string;
    page?: string;
  }>;
}

export default async function DoraWorldListPage({
  params,
  searchParams,
}: PageProps) {
  const { topic, locale } = await params;
  const { t: topicId, page: pageParam } = await searchParams;
  const isLoggedIn = await checkAuth();
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  let result: PaginatedContentsResponse;
  if (topic === 'contents' && !topicId && currentPage !== 1) {
    result = await fetchContentsFromDirectus({
      locale,
      page: currentPage,
      limit: 30,
    });
  } else {
    const nextBuildId = await fetchBuildId();
    result = await fetchContents({
      nextBuildId,
      topic,
      topicId,
      page: currentPage,
    });
  }

  const basePath = `/${locale}/dora-world/${topic}`;
  const searchParamsObj: Record<string, string> = {};
  if (topicId) searchParamsObj.t = topicId;

  const navigationState: Record<string, string | number> = {
    page: currentPage,
  };
  if (topicId) navigationState.t = topicId;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Doraemon Channel
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">
            {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </p>
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
                  basePath={`/${locale}/dora-world/contents`}
                  isLoggedIn={isLoggedIn}
                  pageUrl={article.page_url}
                  navigationState={navigationState}
                  aspectRatio="aspect-29/19"
                />
              ))}
            </div>

            {result.meta.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={result.meta.totalPages}
                basePath={basePath}
                searchParams={searchParamsObj}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
