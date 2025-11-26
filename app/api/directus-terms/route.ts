import { NextResponse } from 'next/server';
import client from '@/lib/api-client';
import type { components } from '@/lib/api/v1';
import type { DirectusTerm } from '@/lib/types/term';

type CharacterItem = components['schemas']['ItemsCharacters'];
type WorkItem = components['schemas']['ItemsWorks'];
type PersonItem = components['schemas']['ItemsPersons'];
type pagesItem = components['schemas']['ItemsPages'];

export async function GET() {
  try {
    const fetchWithJapaneseTranslations = async (
      endpoint:
        | '/items/characters'
        | '/items/works'
        | '/items/persons'
        | '/items/pages',
    ) => {
      return client.GET(endpoint, {
        params: {
          query: {
            fields: ['id', 'translations.*'],
            filter: JSON.stringify({
              translations: {
                languages_code: { _eq: 'ja' },
              },
            }),
          },
        },
      });
    };

    const [charactersResponse, worksResponse, personsResponse, pagesResponse] =
      await Promise.all([
        fetchWithJapaneseTranslations('/items/characters'),
        fetchWithJapaneseTranslations('/items/works'),
        fetchWithJapaneseTranslations('/items/persons'),
        fetchWithJapaneseTranslations('/items/pages'),
      ]);

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
          .filter((t) => t.languages_code === 'ja')
          .map((t) => ({
            id: item.id,
            name: t.name || '',
            type,
          }))
          .filter((t) => t.name);
      });
    };

    const characters = extractNames(charactersResponse.data?.data, 'character');
    const works = extractNames(worksResponse.data?.data, 'work');
    const persons = extractNames(personsResponse.data?.data, 'person');
    const pages = extractNames(pagesResponse.data?.data, 'page');

    return NextResponse.json({
      characters,
      works,
      persons,
      pages,
    });
  } catch (error) {
    console.error('Error fetching Directus terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Directus terms' },
      { status: 500 },
    );
  }
}
