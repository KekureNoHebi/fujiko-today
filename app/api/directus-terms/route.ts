import { NextResponse } from 'next/server';
import client from '@/lib/api-client';
import type { components } from '@/lib/api/v1';
import type { DirectusTerm, SupportedTermType } from '@/lib/types/term';

type CharacterItem = components['schemas']['ItemsCharacters'];
type WorkItem = components['schemas']['ItemsWorks'];
type PersonItem = components['schemas']['ItemsPersons'];
type pagesItem = components['schemas']['ItemsPages'];

const COLLECTION_CONFIG = {
  character: '/items/characters',
  person: '/items/persons',
  work: '/items/works',
  page: '/items/pages',
} as const satisfies Record<SupportedTermType, string>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('lang') || 'ja';

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
        | pagesItem[]
        | undefined,
      type: string,
    ): DirectusTerm[] => {
      if (!items) return [];
      return items.flatMap((item) => {
        if (!item.translations || !Array.isArray(item.translations)) return [];
        return item.translations
          .filter(
            (
              t,
            ): t is { languages_code?: string | null; name?: string | null } =>
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Directus terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Directus terms' },
      { status: 500 },
    );
  }
}
