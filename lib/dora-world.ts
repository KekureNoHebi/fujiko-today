import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

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
        revalidate: 3600,
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

export function replaceTermsInText(
  input: string,
  termsList: { id: string; content: string }[],
): string {
  const sorted = [...termsList].sort(
    (a, b) => b.content.length - a.content.length,
  );

  let result = input;

  for (const term of sorted) {
    const regex = new RegExp(escapeRegExp(term.content), 'g');
    result = result.replace(regex, `{{${term.id}}}`);
  }

  return result;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
