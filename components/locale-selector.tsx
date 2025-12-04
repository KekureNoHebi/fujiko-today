'use client';

import * as React from 'react';
import { useLocaleSelector } from 'gt-next/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { languageLabels } from '@/lib/constants/term';
import { LanguageCode } from '@/lib/types/term';

export default function LocaleSelector({
  locales: _locales,
  ...props
}: {
  locales?: string[];
}): React.JSX.Element | null {
  const { locale, locales, setLocale } = useLocaleSelector(
    _locales ? _locales : undefined,
  );

  const getDisplayName = (locale: string) => {
    return languageLabels[locale as LanguageCode] || locale;
  };

  if (!locales || locales.length === 0 || !setLocale) {
    return null;
  }

  return (
    <Select value={locale || ''} onValueChange={setLocale} {...props}>
      <SelectTrigger className="w-40">
        <SelectValue>
          {locale && <span>{getDisplayName(locale)}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((localeCode) => (
          <SelectItem key={localeCode} value={localeCode}>
            {getDisplayName(localeCode)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
