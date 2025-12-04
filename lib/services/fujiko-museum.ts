import * as cheerio from 'cheerio';
import type { LanguageCode } from '@/lib/types/term';
import type { PaginatedContentsResponse } from '@/lib/types/content';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { TriggerContentTranslationParams } from '@/lib/schemas/translate-content';
import client from '@/lib/api/client';
import {
  findTranslationByLanguage,
  replacePlaceholders,
  createTurndownService,
} from '@/lib/utils/content-helpers';
import { fetchMarkdownFromConfiguredRepo } from '@/lib/services/github-api';

const BASE_URL = 'https://fujiko-museum.com';
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const turndownService = createTurndownService(BASE_URL);

interface WordPressBlogPost {
  id: number;
  date: string;
  modified: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
}

interface WordPressPostsResponse {
  posts: WordPressBlogPost[];
  totalPosts: number;
  totalPages: number;
}

export async function fetchPostsFromDirectus({
  locale,
  page = 1,
  limit = 30,
}: {
  locale: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedContentsResponse> {
  const offset = (page - 1) * limit;

  const response = await client.GET('/items/fujiko_museum_contents', {
    params: {
      query: {
        fields: ['id', 'link', 'thumbnail', 'translations.*'],
        limit,
        offset,
        meta: '*',
        filter: JSON.stringify({
          status: { _eq: 'published' },
        }),
        sort: ['-date_published'],
      },
    },
  });

  if (!response.data?.data) {
    return {
      contents: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  const contents = response.data.data.map((item) => {
    let translation = findTranslationByLanguage(item.translations, locale);

    if (!translation && locale !== 'ja') {
      translation = findTranslationByLanguage(item.translations, 'ja');
    }

    const title =
      typeof translation === 'object' &&
      translation !== null &&
      'title' in translation
        ? (translation.title as string) || ''
        : '';

    return {
      id: parseInt(item.id),
      page_url: item.link || '',
      title,
      image_url: item.thumbnail || '',
    };
  });

  const total = response.data.meta?.filter_count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    contents,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function fetchPosts({
  page = 1,
  perPage = 30,
}: {
  page?: number;
  perPage?: number;
}): Promise<WordPressPostsResponse> {
  const url = `${API_URL}/blog?per_page=${perPage}&page=${page}`;

  const response = await fetch(url, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  const posts: WordPressBlogPost[] = await response.json();
  const totalPosts = parseInt(response.headers.get('x-wp-total') || '0', 10);
  const totalPages = parseInt(
    response.headers.get('x-wp-totalpages') || '1',
    10,
  );

  return {
    posts,
    totalPosts,
    totalPages,
  };
}

export async function fetchPostsAsPaginatedContents({
  page = 1,
  perPage = 30,
}: {
  page?: number;
  perPage?: number;
}): Promise<PaginatedContentsResponse> {
  const { posts, totalPosts, totalPages } = await fetchPosts({ page, perPage });

  const contents = posts.map((post) => ({
    id: post.id,
    page_url: post.link,
    title: post.title.rendered,
    image_url: post.thumbnail?.url || '',
  }));

  return {
    contents,
    meta: {
      total: totalPosts,
      page,
      limit: perPage,
      totalPages,
    },
  };
}

export async function getPost({ postId }: { postId: number }) {
  const response = await fetch(`${API_URL}/blog/${postId}`, {
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.statusText}`);
  }

  const post: WordPressBlogPost = await response.json();
  const $ = cheerio.load(post.content.rendered || '');
  const markdown = turndownService.turndown($.html() || '');
  return markdown;
}

export async function getPostWithFallback({
  postId,
  locale,
}: {
  postId: number;
  locale: string;
}): Promise<{
  markdown: string;
  translationRequests?: TriggerContentTranslationParams[];
}> {
  const basePath = `/fujiko-museum/blog/${postId}`;

  let markdown: string;
  const translationRequests: TriggerContentTranslationParams[] = [];

  try {
    markdown = await fetchMarkdownFromConfiguredRepo(
      `${basePath}/${locale}/content.md`,
    );

    const termsData = await fetchDirectusTerms(locale);
    markdown = replacePlaceholders(markdown, termsData);
  } catch {
    try {
      markdown = await fetchMarkdownFromConfiguredRepo(
        `${basePath}/ja/content.md`,
      );

      const termsData = await fetchDirectusTerms('ja');
      markdown = replacePlaceholders(markdown, termsData);

      // translationRequests.push({
      //   text: markdown,
      //   targetLanguage: locale as LanguageCode,
      //   sourceLanguage: 'ja',
      //   uploadPath: `${basePath}/${locale}/content.md`,
      //   revalidatePath: `/${locale}/fujiko-museum/blog/${postId}`,
      //   idempotencyKey: `fujiko-museum-${postId}-${locale}`,
      //   idempotencyKeyTTL: '60s',
      // });
    } catch {
      markdown = await getPost({ postId });

      // translationRequests.push({
      //   text: markdown,
      //   targetLanguage: locale as LanguageCode,
      //   sourceLanguage: 'ja',
      //   uploadPath: `${basePath}/${locale}/content.md`,
      //   revalidatePath: `/${locale}/fujiko-museum/blog/${postId}`,
      //   idempotencyKey: `fujiko-museum-${postId}-${locale}`,
      //   idempotencyKeyTTL: '60s',
      // });

      if (locale !== 'ja') {
        // translationRequests.push({
        //   text: markdown,
        //   targetLanguage: 'ja',
        //   sourceLanguage: 'ja',
        //   uploadPath: `${basePath}/ja/content.md`,
        //   revalidatePath: `/ja/fujiko-museum/blog/${postId}`,
        //   idempotencyKey: `fujiko-museum-${postId}-ja`,
        //   idempotencyKeyTTL: '60s',
        // });
      }
    }
  }

  return {
    markdown,
    translationRequests:
      translationRequests.length > 0 ? translationRequests : undefined,
  };
}
