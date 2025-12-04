'use client';

import * as React from 'react';
import { useLocaleSelector } from 'gt-next/client';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { languageLabels } from '@/lib/constants/term';
import { LanguageCode } from '@/lib/types/term';

export default function LocaleSelector({
  locales: _locales,
  ...props
}: {
  locales?: string[];
}): React.JSX.Element | null {
  const [mounted, setMounted] = React.useState(false);
  const { locale, locales, setLocale } = useLocaleSelector(
    _locales ? _locales : undefined,
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getDisplayName = (locale: string) => {
    return languageLabels[locale as LanguageCode] || locale;
  };

  if (!mounted || !locales || locales.length === 0 || !setLocale) {
    return null;
  }

  return (
    <Select value={locale || ''} onValueChange={setLocale} {...props}>
      <SelectTrigger className="w-12 h-10 p-0 border-0 hover:bg-accent shadow-none">
        <Languages className="h-6 w-6 mx-auto" />
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
