import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import type { DirectusTerm, LanguageCode } from '@/lib/types/term';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { TriggerContentTranslationParams } from '@/lib/schemas/translate-content';

const BASE_URL = 'https://www.dora-world.com';
const turndownService = new TurndownService();
turndownService.addRule('anchor-with-block', {
  filter: function (node) {
    if (node.nodeName !== 'A' || !node.querySelectorAll) return false;
    const blockTags = new Set(['DIV']);
    const descendants = node.querySelectorAll('*');
    return Array.prototype.some.call(descendants, (n) =>
      blockTags.has(n.nodeName),
    );
  },
  replacement: function (content, node) {
    let href = node.getAttribute('href') || '';
    if (href && href.startsWith('/')) {
      href = BASE_URL + href;
    }
    const text = (node.textContent || '').trim();
    return '\n\n[' + text + '](' + href + ')\n\n';
  },
});

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

export async function fetchContents({
  nextBuildId,
  topic,
  topicId,
}: {
  nextBuildId: string;
  topic: string;
  topicId?: string;
}) {
  const topicIdParam = topicId ? `?t=${topicId}` : '';
  const dataResponse = await fetch(
    `${BASE_URL}/_next/data/${nextBuildId}/${topic}.json${topicIdParam}`,
    {
      next: {
        revalidate: 60,
      },
    },
  );
  const data: ContentsResponse = await dataResponse.json();
  return data;
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
  const $ = cheerio.load(content.content || '');
  const main = $('.main_unit');
  main.find('.tag').remove();
  main.find('div[style="display:none"]').remove();
  main.find('ruby').remove();

  const markdown = turndownService.turndown($.html(main) || '');

  return markdown;
}

function replacePlaceholders(
  markdown: string,
  termsData: Record<string, DirectusTerm[]>,
): string {
  let result = markdown;

  for (const [type, terms] of Object.entries(termsData)) {
    for (const term of terms) {
      const placeholder = `{{${type}.${term.id}}}`;
      const regex = new RegExp(escapeRegExp(placeholder), 'g');
      result = result.replace(regex, term.name);
    }
  }

  return result;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const basePath = `/fujiko-today/dora-world/contents/${contentId}`;
  const remoteUrl = `${process.env.CONTENTS_URL}/d${basePath}/${locale}/content.md`;
  const jaUrl = `${process.env.CONTENTS_URL}/d${basePath}/ja/content.md`;

  let markdown: string;
  const translationRequests: TriggerContentTranslationParams[] = [];

  try {
    const response = await fetch(remoteUrl);

    if (response.ok) {
      markdown = await response.text();
      const termsData = await fetchDirectusTerms(locale);

      markdown = replacePlaceholders(markdown, termsData);
    } else {
      const jaResponse = await fetch(jaUrl);
      if (jaResponse.ok) {
        markdown = await jaResponse.text();
        const termsData = await fetchDirectusTerms('ja');
        markdown = replacePlaceholders(markdown, termsData);
        translationRequests.push({
          text: markdown,
          targetLanguage: locale as LanguageCode,
          sourceLanguage: 'ja',
          uploadPath: `${basePath}/${locale}/content.md`,
          revalidatePath: `/${locale}/dora-world/contents/${contentId}`,
          idempotencyKey: `dora-world-${contentId}-${locale}`,
          idempotencyKeyTTL: '60s',
        });
      } else {
        throw new Error(
          'Content not found in both target and Japanese locales',
        );
      }
    }
  } catch {
    markdown = await getContent({ nextBuildId, contentId });
    translationRequests.push({
      text: markdown,
      targetLanguage: locale as LanguageCode,
      sourceLanguage: 'ja',
      uploadPath: `${basePath}/${locale}/content.md`,
      revalidatePath: `/${locale}/dora-world/contents/${contentId}`,
      idempotencyKey: `dora-world-${contentId}-${locale}`,
      idempotencyKeyTTL: '60s',
    });
    if (locale !== 'ja') {
      translationRequests.push({
        text: markdown,
        targetLanguage: 'ja',
        sourceLanguage: 'ja',
        uploadPath: `${basePath}/ja/content.md`,
        revalidatePath: `/ja/dora-world/contents/${contentId}`,
        idempotencyKey: `dora-world-${contentId}-ja`,
        idempotencyKeyTTL: '60s',
      });
    }
  }

  return {
    markdown,
    translationRequests:
      translationRequests.length > 0 ? translationRequests : undefined,
  };
}
