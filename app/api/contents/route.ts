import { NextRequest, NextResponse } from 'next/server';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { replacePlaceholders } from '@/lib/utils/content-helpers';

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const path = request.nextUrl.searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 },
      );
    }

    const remoteUrl = `${process.env.CONTENTS_URL}/d${path}`;

    const response = await fetch(remoteUrl);

    if (!response.ok) {
      return NextResponse.json({ exists: false });
    }

    let markdown = await response.text();
    const termsData = await fetchDirectusTerms(locale);
    markdown = replacePlaceholders(markdown, termsData);

    return NextResponse.json({
      exists: true,
      markdown,
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
