// 定义常量数组（单一数据源）
export const TERM_TYPES = [
  'character',
  'person',
  'work',
  'place',
  'object',
  'other',
] as const;

// 从常量派生类型
export type TermType = (typeof TERM_TYPES)[number];

export const LANGUAGE_CODES = ['en-US', 'zh-CN', 'zh-TW', 'zh-HK'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

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
