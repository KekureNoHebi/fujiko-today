'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type {
  Term,
  TranslationFormData,
  LanguageCode,
  SupportedTermType,
} from '@/lib/types/term';
import { SUPPORTED_TERM_TYPES, LANGUAGE_CODES } from '@/lib/types/term';
import { typeLabels, languageLabels } from '@/lib/constants/term';
import { generateSlug, validateSlug } from '@/lib/utils/slug';
import { toast } from 'sonner';
import { saveTermAction, translateTermAction } from '@/lib/actions/term';

interface TranslateTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term | null;
  onSuccess?: () => void;
}

export function TranslateTermsDialog({
  open,
  onOpenChange,
  term,
  onSuccess,
}: TranslateTermsDialogProps) {
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TranslationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    if (!term || !open) {
      setFormData(null);
      setError(null);
      setIdError(null);
      return;
    }

    const fetchTranslations = async () => {
      setTranslating(true);
      setError(null);

      try {
        const data = await translateTermAction({ text: term.name });

        const termType = term.directusMatches?.[0]?.type || term.type;
        const validType = SUPPORTED_TERM_TYPES.includes(
          termType as SupportedTermType,
        )
          ? (termType as SupportedTermType)
          : 'character';

        setFormData({
          id: term.directusMatches?.[0]?.id || generateSlug(data['en']),
          type: validType,
          translations: Object.fromEntries(
            LANGUAGE_CODES.map((code) => [code, data[code]]),
          ) as Record<LanguageCode, string>,
        });
      } catch (err) {
        console.error('Failed to translate:', err);
        setError('Failed to translate');
      } finally {
        setTranslating(false);
      }
    };

    fetchTranslations();
  }, [term, open]);

  const handleIdChange = (value: string) => {
    if (!formData) return;

    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, id: sanitized });

    if (!validateSlug(sanitized)) {
      setIdError('ID must contain only lowercase letters, numbers, and dashes');
    } else {
      setIdError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !term || idError) return;

    setIsSubmitting(true);

    try {
      await saveTermAction({
        type: formData.type,
        formData,
        existingId: term.directusMatches?.[0]?.id,
      });

      toast.success('Term saved successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to save term:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save term');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
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
          ) : formData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="term-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: SupportedTermType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="term-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_TERM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term-id">ID (slug)</Label>
                <Input
                  id="term-id"
                  value={formData.id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="example-slug"
                  className={idError ? 'border-red-500' : ''}
                  disabled={!!term?.directusMatches?.[0]?.id}
                />
                {idError && <p className="text-sm text-red-500">{idError}</p>}
                {term?.directusMatches?.[0]?.id ? (
                  <p className="text-xs text-muted-foreground">
                    This term already exists in Directus. ID cannot be changed.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only lowercase letters, numbers, and dashes allowed
                  </p>
                )}
              </div>

              {Object.entries(languageLabels).map(([code, label]) => (
                <div key={code} className="space-y-2">
                  <Label htmlFor={`translation-${code}`}>{label}</Label>
                  <Input
                    id={`translation-${code}`}
                    value={formData.translations[code as LanguageCode]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [code]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !!idError}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save to Directus'
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
