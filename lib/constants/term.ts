import type { TermType, LanguageCode } from '@/lib/types/term';

export const typeColors: Record<TermType, string> = {
  character: 'bg-blue-500',
  person: 'bg-green-500',
  work: 'bg-purple-500',
  place: 'bg-red-500',
  object: 'bg-yellow-500',
  other: 'bg-gray-500',
} as const;

export const typeLabels: Record<TermType, string> = {
  character: 'Character',
  person: 'Person',
  work: 'Work',
  place: 'Place',
  object: 'Object',
  other: 'Other',
} as const;

export const languageLabels: Record<LanguageCode, string> = {
  ja: '日本語',
  'en-US': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文（台灣）',
  'zh-HK': '繁體中文（香港）',
} as const;
