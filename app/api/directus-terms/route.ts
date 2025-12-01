import { NextResponse } from 'next/server';
import { fetchDirectusTerms } from '@/lib/directus-terms';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('lang') || 'ja';

    const result = await fetchDirectusTerms(languageCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Directus terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Directus terms' },
      { status: 500 },
    );
  }
}
