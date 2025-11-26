'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Term, Translations } from '@/lib/types/term';
import { typeLabels, languageLabels } from '@/lib/constants/term';
import { translateTerm } from '@/lib/api/term-api';

interface TranslateTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term | null;
}

export function TranslateTermsDialog({
  open,
  onOpenChange,
  term,
}: TranslateTermsDialogProps) {
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!term || !open) {
      setTranslations(null);
      setError(null);
      return;
    }

    const fetchTranslations = async () => {
      setTranslating(true);
      setTranslations(null);
      setError(null);

      try {
        const data = await translateTerm({ text: term.name });
        setTranslations(data);
      } catch (err) {
        console.error('Failed to translate:', err);
        setError('Failed to translate');
      } finally {
        setTranslating(false);
      }
    };

    fetchTranslations();
  }, [term, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{term?.name}</DialogTitle>
          <DialogDescription>
            Type:{' '}
            {term?.type && typeLabels[term.type as keyof typeof typeLabels]}
            {term?.directusMatches && term.directusMatches.length > 0 && (
              <span className="ml-2 text-green-500">
                ✓ In Directus (
                {term.directusMatches.map((m) => m.type).join(', ')})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {translating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Translating...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : translations ? (
            <div className="space-y-4">
              {Object.entries(translations).map(([lang, translation]) => (
                <div key={lang} className="space-y-1">
                  <div className="text-sm font-semibold text-muted-foreground">
                    {languageLabels[lang as keyof typeof languageLabels]}:
                  </div>
                  <div className="text-base font-mono">{translation}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
