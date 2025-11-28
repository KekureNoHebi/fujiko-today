import type {
  AnalyzeRequest,
  AnalysisResult,
  TranslateRequest,
  Translations,
  CreateTermRequest,
  CreateTermResponse,
} from '@/lib/types/term';

export async function analyzeTerms(
  request: AnalyzeRequest,
): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze-terms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze terms');
  }

  return response.json();
}

export async function translateTerm(
  request: TranslateRequest,
): Promise<Translations> {
  const response = await fetch('/api/translate-terms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to translate term');
  }

  return response.json();
}

export async function getDirectusTerms(languageCode?: string) {
  const url = new URL('/api/directus-terms', window.location.origin);
  if (languageCode) {
    url.searchParams.set('lang', languageCode);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch Directus terms');
  }

  return response.json();
}

export async function saveTerm(
  request: CreateTermRequest,
): Promise<CreateTermResponse> {
  const response = await fetch('/api/save-term', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save term');
  }

  return response.json();
}
