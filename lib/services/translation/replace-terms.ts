import type { DirectusTerm } from '@/lib/types/term';

export function replaceTermsWithPlaceholders(
  text: string,
  terms: DirectusTerm[],
): string {
  let processedText = text;

  const sortedTerms = [...terms].sort((a, b) => b.name.length - a.name.length);

  sortedTerms.forEach((term) => {
    const regex = new RegExp(
      term.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'g',
    );
    processedText = processedText.replace(regex, `{{${term.type}.${term.id}}}`);
  });

  return processedText;
}
