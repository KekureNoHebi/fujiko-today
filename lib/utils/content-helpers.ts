import TurndownService from 'turndown';
import type { DirectusTerm } from '@/lib/types/term';

export function findTranslationByLanguage(
  translations: unknown[] | null | undefined,
  languageCode: string,
): unknown {
  return translations?.find((t) => {
    if (typeof t !== 'object' || t === null || !('languages_code' in t))
      return false;
    const langCode = (t as { languages_code: unknown }).languages_code;
    if (typeof langCode === 'string') return langCode === languageCode;
    if (
      typeof langCode === 'object' &&
      langCode !== null &&
      'code' in langCode
    ) {
      return (langCode as { code: string }).code === languageCode;
    }
    return false;
  });
}

export function replacePlaceholders(
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

export function createTurndownService(baseUrl: string): TurndownService {
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
    replacement: function (_content, node) {
      let href = node.getAttribute('href') || '';
      if (href && href.startsWith('/')) {
        href = baseUrl + href;
      }
      const text = (node.textContent || '').trim();
      return '\n\n[' + text + '](' + href + ')\n\n';
    },
  });
  return turndownService;
}
