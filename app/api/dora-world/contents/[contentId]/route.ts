import { NextRequest, NextResponse } from 'next/server';
import { replacePlaceholders } from '@/lib/services/dora-world';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';

interface RouteParams {
  params: Promise<{
    contentId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    const basePath = `/fujiko-today/dora-world/contents/${contentId}`;
    const remoteUrl = `${process.env.CONTENTS_URL}/d${basePath}/${locale}/content.md`;

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
