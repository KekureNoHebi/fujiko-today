import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/api-client';
import type { CreateTermRequest } from '@/lib/types/term';
import { validateSlug } from '@/lib/utils/slug';
import {
  SUPPORTED_TERM_TYPES,
  LANGUAGE_CODES,
  SupportedTermType,
} from '@/lib/types/term';

const COLLECTION_CONFIG = {
  character: '/items/characters',
  person: '/items/persons',
  work: '/items/works',
  page: '/items/pages',
} as const satisfies Record<SupportedTermType, string>;

type CollectionType = keyof typeof COLLECTION_CONFIG;

export async function POST(request: NextRequest) {
  try {
    const { type, formData, existingId } =
      (await request.json()) as CreateTermRequest;

    if (!SUPPORTED_TERM_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid term type. Only character, person, and work are supported.',
        },
        { status: 400 },
      );
    }

    const endpoint = COLLECTION_CONFIG[type as CollectionType];
    const itemId = existingId || formData.id;

    if (!validateSlug(itemId)) {
      return NextResponse.json(
        {
          error:
            'Invalid ID format. Only lowercase letters, numbers, and dashes are allowed.',
        },
        { status: 400 },
      );
    }

    const translations = LANGUAGE_CODES.map((code) => ({
      languages_code: code,
      name: formData.translations[code],
    }));

    const payload = {
      id: itemId,
      status: 'published',
      translations,
    };

    if (existingId) {
      const response = await client.PATCH(`${endpoint}/{id}`, {
        params: {
          path: { id: itemId },
        },
        body: payload,
      });

      if (response.error) {
        console.error('Failed to update item:', response.error);
        return NextResponse.json(
          {
            error: 'Failed to update item',
            details: response.error,
          },
          { status: 500 },
        );
      }
    } else {
      const response = await client.POST(endpoint, {
        body: payload,
      });

      if (response.error) {
        console.error('Failed to create item:', response.error);
        return NextResponse.json(
          {
            error: 'Failed to create item',
            details: response.error,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      itemId,
      message: 'Term saved successfully',
    });
  } catch (error) {
    console.error('Error saving term:', error);
    return NextResponse.json(
      { error: 'Failed to save term', details: String(error) },
      { status: 500 },
    );
  }
}
