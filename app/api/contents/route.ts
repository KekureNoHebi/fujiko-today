import { NextRequest, NextResponse } from 'next/server';
import { fetchDirectusTerms } from '@/lib/services/directus-terms';
import { replacePlaceholders } from '@/lib/utils/content-helpers';
import { defaultGitHubConfig, fetchFile } from '@/lib/services/github-api';

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

    const result = await fetchFile({ path, ...defaultGitHubConfig });

    if (result.status !== 'success') {
      return NextResponse.json({ exists: false });
    }

    const termsData = await fetchDirectusTerms(locale);
    const processedMarkdown = replacePlaceholders(result.data, termsData);

    return NextResponse.json({
      exists: true,
      markdown: processedMarkdown,
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
