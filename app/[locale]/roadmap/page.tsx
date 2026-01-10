import { RoadmapBoard } from '@/components/roadmap/roadmap-board';
import { sql } from '@/lib/db';
import type { Database } from '@/lib/types/database';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getGT } from 'gt-next/server';
import { generatePageMetadata } from '@/lib/utils/metadata';
import { revalidatePath } from 'next/cache';

type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];

const COOKIE_PREFIX = 'roadmap_vote_';
const MAX_AGE = 315360000;

interface PageProps {
  params: Promise<{ locale: string }>;
}

async function handleVote(
  itemId: number,
  action: 'vote' | 'unvote',
  locale: string,
) {
  'use server';

  if (!itemId || typeof itemId !== 'number') {
    throw new Error('Invalid item ID');
  }

  if (action !== 'vote' && action !== 'unvote') {
    throw new Error('Invalid action');
  }

  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${itemId}`;
  const hasVoted = cookieStore.get(cookieName);

  if (action === 'vote') {
    if (hasVoted) {
      throw new Error('Already voted');
    }

    await sql`
      UPDATE roadmap_items
      SET vote_count = vote_count + 1
      WHERE id = ${itemId}
    `;

    cookieStore.set(cookieName, '1', {
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  } else {
    if (!hasVoted) {
      throw new Error('Not voted yet');
    }

    await sql`
      UPDATE roadmap_items
      SET vote_count = GREATEST(vote_count - 1, 0)
      WHERE id = ${itemId}
    `;

    cookieStore.delete(cookieName);
  }

  revalidatePath(`/${locale}/roadmap`);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getGT();
  const { locale } = await params;

  const metaTitle = t('Roadmap');
  const metaDescription = t('Vote for your favorite features');

  return generatePageMetadata({
    title: metaTitle,
    description: metaDescription,
    locale,
    path: '/roadmap',
    type: 'website',
  });
}

async function getRoadmapItems(): Promise<RoadmapItem[]> {
  const items = (await sql`
    SELECT
      id,
      title,
      description,
      status,
      type,
      target_date,
      vote_count,
      created_at,
      updated_at
    FROM roadmap_items
    ORDER BY vote_count DESC, created_at DESC
  `) as RoadmapItem[];

  return items;
}

export default async function RoadmapPage({ params }: PageProps) {
  const t = await getGT();
  const { locale } = await params;
  const items = await getRoadmapItems();
  const cookieStore = await cookies();

  // Check which items the user has voted for
  const votedItems = new Set<number>();
  items.forEach((item) => {
    const cookieName = `${COOKIE_PREFIX}${item.id}`;
    if (cookieStore.get(cookieName)) {
      votedItems.add(item.id);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
          {t('Roadmap')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t(
            'Vote for the features you most look forward to. You can change your vote at any time.',
          )}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('No roadmap items yet')}
        </div>
      ) : (
        <RoadmapBoard
          items={items}
          votedItems={votedItems}
          onVote={handleVote}
          locale={locale}
        />
      )}
    </div>
  );
}
