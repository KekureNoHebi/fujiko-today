export const TERM_TYPES = [
  'character',
  'person',
  'work',
  'place',
  'object',
  'other',
] as const;

export type TermType = (typeof TERM_TYPES)[number];

export const LANGUAGE_CODES = [
  'ja',
  'en-US',
  'zh-CN',
  'zh-TW',
  'zh-HK',
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const SUPPORTED_TERM_TYPES = [
  'character',
  'person',
  'work',
  'page',
] as const;

export type SupportedTermType = (typeof SUPPORTED_TERM_TYPES)[number];

export interface DirectusTerm {
  id: string;
  name: string;
  type: string;
}

export interface Term {
  name: string;
  type: TermType;
  directusMatches?: DirectusTerm[];
}

export type Translations = Record<LanguageCode, string>;

export interface AnalysisResult {
  terms: Term[];
}

export interface DirectusTermsResponse {
  characters: DirectusTerm[];
  works: DirectusTerm[];
  persons: DirectusTerm[];
  pages: DirectusTerm[];
}

export interface TranslateRequest {
  text: string;
}

export interface AnalyzeRequest {
  text: string;
}

export interface TranslationFormData {
  id: string;
  type: SupportedTermType;
  translations: Record<LanguageCode, string>;
}

export interface CreateTermRequest {
  type: SupportedTermType;
  formData: TranslationFormData;
  existingId?: string;
}

export interface CreateTermResponse {
  success: boolean;
  itemId: string;
  message?: string;
}
