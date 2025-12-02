import { fetchBuildId, fetchContents } from '@/lib/services/dora-world';
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
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            <T>Articles</T>
          </h1>
        </header>

        {articles.length === 0 ? (
          <p className="text-muted-foreground py-12">
            <T>No articles found</T>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
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
    </div>
  );
}
