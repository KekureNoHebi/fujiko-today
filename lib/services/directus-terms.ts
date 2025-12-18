import client from '@/lib/api/client';
import type { components } from '@/lib/api/v1';
import type { DirectusTerm, SupportedTermType } from '@/lib/types/term';

type CharacterItem = components['schemas']['ItemsCharacters'];
type WorkItem = components['schemas']['ItemsWorks'];
type PersonItem = components['schemas']['ItemsPersons'];
type PagesItem = components['schemas']['ItemsPages'];
type MovieItem = components['schemas']['ItemsMovies'];
type StoryItem = components['schemas']['ItemsStories'];

export const COLLECTION_CONFIG = {
  character: '/items/characters',
  person: '/items/persons',
  work: '/items/works',
  page: '/items/pages',
  movie: '/items/movies',
  story: '/items/stories',
} as const satisfies Record<SupportedTermType, string>;

export async function fetchDirectusTerms(
  languageCode: string,
): Promise<Record<string, DirectusTerm[]>> {
  const fetchWithTranslations = async (
    endpoint: (typeof COLLECTION_CONFIG)[SupportedTermType],
  ) => {
    return client.GET(endpoint, {
      params: {
        query: {
          fields: ['id', 'translations.*'],
          filter: JSON.stringify({
            translations: {
              languages_code: { _eq: languageCode },
            },
          }),
        },
      },
    });
  };

  const extractNames = (
    items:
      | CharacterItem[]
      | WorkItem[]
      | PersonItem[]
      | PagesItem[]
      | MovieItem[]
      | StoryItem[]
      | undefined,
    type: string,
  ): DirectusTerm[] => {
    if (!items) return [];
    return items.flatMap((item) => {
      if (!item.translations || !Array.isArray(item.translations)) return [];
      return item.translations
        .filter(
          (t): t is { languages_code?: string | null; name?: string | null } =>
            typeof t === 'object' && t !== null && 'languages_code' in t,
        )
        .filter((t) => t.languages_code === languageCode)
        .map((t) => ({
          id: item.id,
          name: t.name || '',
          type,
        }))
        .filter((t) => t.name);
    });
  };

  const responses = await Promise.all(
    Object.entries(COLLECTION_CONFIG).map(async ([type, endpoint]) => ({
      type: type as SupportedTermType,
      response: await fetchWithTranslations(endpoint),
    })),
  );

  const result = responses.reduce(
    (acc, { type, response }) => {
      acc[type] = extractNames(response.data?.data, type);
      return acc;
    },
    {} as Record<string, DirectusTerm[]>,
  );

  return result;
}

export interface TermWithAllLanguages {
  id: string;
  type: SupportedTermType;
  translations: Record<string, string>;
}

export async function fetchAllTermsWithAllLanguages(): Promise<
  Record<SupportedTermType, TermWithAllLanguages[]>
> {
  const fetchAllTranslations = async (
    endpoint: (typeof COLLECTION_CONFIG)[SupportedTermType],
  ) => {
    return client.GET(endpoint, {
      params: {
        query: {
          fields: ['id', 'translations.*'],
        },
      },
    });
  };

  const extractAllLanguages = (
    items:
      | CharacterItem[]
      | WorkItem[]
      | PersonItem[]
      | PagesItem[]
      | MovieItem[]
      | StoryItem[]
      | undefined,
    type: SupportedTermType,
  ): TermWithAllLanguages[] => {
    if (!items) return [];
    return items
      .map((item) => {
        if (!item.translations || !Array.isArray(item.translations))
          return null;

        const translations: Record<string, string> = {};
        item.translations.forEach((t) => {
          if (
            typeof t === 'object' &&
            t !== null &&
            'languages_code' in t &&
            'name' in t &&
            typeof t.languages_code === 'string' &&
            typeof t.name === 'string'
          ) {
            translations[t.languages_code] = t.name;
          }
        });

        if (Object.keys(translations).length === 0) return null;

        return {
          id: item.id,
          type,
          translations,
        };
      })
      .filter((item): item is TermWithAllLanguages => item !== null);
  };

  const responses = await Promise.all(
    Object.entries(COLLECTION_CONFIG).map(async ([type, endpoint]) => ({
      type: type as SupportedTermType,
      response: await fetchAllTranslations(endpoint),
    })),
  );

  const result = responses.reduce(
    (acc, { type, response }) => {
      acc[type] = extractAllLanguages(response.data?.data, type);
      return acc;
    },
    {} as Record<SupportedTermType, TermWithAllLanguages[]>,
  );

  return result;
}
