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
import { defaultGitHubConfig, fetchFile } from '@/lib/services/github-api';

const BASE_URL = 'https://www.dora-world.com';
const turndownService = createTurndownService(BASE_URL);

interface NextData {
  buildId: string;
}

interface ContentsResponse {
  pageProps: {
    contents: Array<{
      id: number;
      page_url: string;
      title: string;
      image_url: string;
    }>;
    total_count: number;
  };
}

interface ContentResponse {
  pageProps: {
    content: {
      title: string;
      content: string;
    };
  };
}

export async function fetchBuildId(): Promise<string> {
  const response = await fetch(BASE_URL, {
    next: {
      revalidate: 3600,
    },
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (!nextDataScript) {
    throw new Error('Build ID not found');
  }
  const nextData: NextData = JSON.parse(nextDataScript);
  return nextData.buildId;
}

export async function fetchContentsFromDirectus({
  locale,
  page = 1,
  limit = 30,
}: {
  locale: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedContentsResponse> {
  const offset = (page - 1) * limit;

  const response = await client.GET('/items/dora_world_contents', {
    params: {
      query: {
        fields: ['id', 'page_url', 'image_url', 'translations.*'],
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
      page_url: item.page_url || '',
      title,
      image_url: item.image_url || '',
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

export async function fetchContents({
  nextBuildId,
  topic,
  topicId,
  page = 1,
}: {
  nextBuildId: string;
  topic: string;
  topicId?: string;
  page?: number;
}): Promise<PaginatedContentsResponse> {
  const params = new URLSearchParams();
  if (topicId) params.append('t', topicId);
  if (page && page > 1) params.append('page', page.toString());

  const queryString = params.toString();
  const url = `${BASE_URL}/_next/data/${nextBuildId}/${topic}.json${queryString ? `?${queryString}` : ''}`;

  const dataResponse = await fetch(url, {
    next: {
      revalidate: 60,
    },
  });
  const data: ContentsResponse = await dataResponse.json();

  const contents = data?.pageProps?.contents || [];
  const total = data?.pageProps?.total_count || 0;
  const totalPages = Math.ceil(total / 30);

  return {
    contents,
    meta: {
      total,
      page,
      limit: 30,
      totalPages,
    },
  };
}

export function processContentHtmlToMarkdown(htmlContent: string): string {
  const $ = cheerio.load(htmlContent || '');
  const main = $('.main_unit');

  const element = main.length > 0 ? main : $('body');

  element.find('.tag').remove();
  element.find('.sns_Area').remove();
  element.find('div[style="display:none"]').remove();
  element.find('ruby').remove();

  element.find('img').each((_, img) => {
    const src = $(img).attr('src');
    if (src && !src.startsWith('http')) {
      $(img).attr(
        'src',
        `https://contents.dora-world.com${src.startsWith('/') ? '' : '/'}${src}`,
      );
    }
  });

  const markdown = turndownService.turndown($.html(element) || '');
  return markdown;
}

export async function getContent({
  nextBuildId,
  contentId,
}: {
  nextBuildId: string;
  contentId: number;
}) {
  const response = await fetch(
    `${BASE_URL}/_next/data/${nextBuildId}/contents/${contentId}.json`,
  );
  const data: ContentResponse = await response.json();
  const content = data.pageProps.content;
  return processContentHtmlToMarkdown(content.content);
}

export async function getContentWithFallback({
  nextBuildId,
  contentId,
  locale,
}: {
  nextBuildId: string;
  contentId: number;
  locale: string;
}): Promise<{
  markdown: string;
  translationRequests?: TriggerContentTranslationParams[];
}> {
  const basePath = `/dora-world/contents/${contentId}`;

  let markdown: string;
  const translationRequests: TriggerContentTranslationParams[] = [];

  const localeResult = await fetchFile({
    path: `${basePath}/${locale}/content.md`,
    ...defaultGitHubConfig,
  });

  if (localeResult.status === 'success') {
    const termsData = await fetchDirectusTerms(locale);
    markdown = replacePlaceholders(localeResult.data, termsData);
  } else {
    const jaResult = await fetchFile({
      path: `${basePath}/ja/content.md`,
      ...defaultGitHubConfig,
    });

    if (jaResult.status === 'success') {
      const termsData = await fetchDirectusTerms('ja');
      markdown = replacePlaceholders(jaResult.data, termsData);
    } else {
      markdown = await getContent({ nextBuildId, contentId });
    }

    translationRequests.push({
      text: markdown,
      targetLanguage: locale as LanguageCode,
      sourceLanguage: 'ja',
      uploadPath: `${basePath}/${locale}/content.md`,
      uploadSourcePath: `${basePath}/ja/content.md`,
      revalidatePath: `/${locale}/dora-world/contents/${contentId}`,
      idempotencyKey: `dora-world-${contentId}-${locale}`,
      idempotencyKeyTTL: '60s',
    });
  }

  return {
    markdown,
    translationRequests:
      translationRequests.length > 0 ? translationRequests : undefined,
  };
}
