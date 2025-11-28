import { fetchBuildId, fetchContents } from '@/lib/dora-world';
import { ArticleCard } from '@/components/article-card';
import { T } from 'gt-next';
import { checkAuth } from '@/lib/auth';

interface PageProps {
  params: Promise<{
    locale: string;
    topic: string;
  }>;
  searchParams: Promise<{
    t?: string;
  }>;
}

export default async function DoraWorldListPage({
  params,
  searchParams,
}: PageProps) {
  const { topic } = await params;
  const { t: topicId } = await searchParams;
  const isLoggedIn = await checkAuth();
  const nextBuildId = await fetchBuildId();
  const response = await fetchContents({
    nextBuildId,
    topic,
    topicId,
  });

  const articles = response?.pageProps.contents || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-semibold mb-8 text-foreground">
        <T>Articles</T>
      </h1>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">
          <T>No articles found</T>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              imageUrl={article.image_url}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
