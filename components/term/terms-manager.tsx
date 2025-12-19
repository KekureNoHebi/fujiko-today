'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { languageLabels } from '@/lib/constants/term';
import type { LanguageCode, SupportedTermType } from '@/lib/types/term';
import type { TermWithAllLanguages } from '@/lib/services/directus-terms';
import { getAllTermsWithAllLanguagesAction } from '@/lib/actions/term';
import { ChevronDown } from 'lucide-react';
import { generateTranslationPrompt } from '@/lib/utils/translation-prompt';

const availableLanguages = Object.keys(languageLabels) as LanguageCode[];

const typeLabels: Record<SupportedTermType, string> = {
  character: 'Characters',
  person: 'Persons',
  work: 'Works',
  page: 'Pages',
  movie: 'Movies',
  story: 'Stories',
};

interface TermsManagerProps {
  locale?: LanguageCode;
}

export function TermsManager({ locale }: TermsManagerProps) {
  const [terms, setTerms] = useState<
    Record<SupportedTermType, TermWithAllLanguages[]>
  >({
    character: [],
    person: [],
    work: [],
    page: [],
    movie: [],
    story: [],
  });
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('ja');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    locale || 'en',
  );
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<SupportedTermType>>(
    new Set(['character', 'person', 'work', 'page', 'movie', 'story']),
  );

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const data = await getAllTermsWithAllLanguagesAction();
      setTerms(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load terms',
      );
      console.error('Load terms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTerm = (termId: string) => {
    setSelectedTerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  const toggleType = (type: SupportedTermType) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const selectAllInType = (type: SupportedTermType, select: boolean) => {
    setSelectedTerms((prev) => {
      const newSet = new Set(prev);
      terms[type].forEach((term) => {
        if (select) {
          newSet.add(term.id);
        } else {
          newSet.delete(term.id);
        }
      });
      return newSet;
    });
  };

  const generatePrompt = async () => {
    if (selectedTerms.size === 0) {
      toast.error('Please select at least one term');
      return;
    }

    return generateTranslationPrompt({
      targetLanguage,
      text: '',
    });
  };

  const copyPrompt = async () => {
    const prompt = await generatePrompt();
    if (!prompt) return;

    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        toast.success('Prompt copied to clipboard!');
      })
      .catch((error) => {
        toast.error('Failed to copy prompt');
        console.error('Copy error:', error);
      });
  };

  const selectedCount = selectedTerms.size;
  const totalCount = Object.values(terms).reduce(
    (sum, typeTerms) => sum + typeTerms.length,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)] max-w-7xl mx-auto">
      <div className="h-full flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Terms Manager</h1>
            <p className="text-sm text-muted-foreground">
              Select terms and generate translation prompts
            </p>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Language</label>
              <Select
                value={sourceLanguage}
                onValueChange={(value) =>
                  setSourceLanguage(value as LanguageCode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {languageLabels[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Language</label>
              <Select
                value={targetLanguage}
                onValueChange={(value) =>
                  setTargetLanguage(value as LanguageCode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {languageLabels[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={copyPrompt} disabled={selectedCount === 0}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Prompt ({selectedCount} selected)
            </Button>
            <div className="text-sm text-muted-foreground">
              {totalCount} terms total
            </div>
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-auto space-y-3">
          {(
            Object.entries(terms) as [
              SupportedTermType,
              TermWithAllLanguages[],
            ][]
          ).map(([type, typeTerms]) => {
            if (typeTerms.length === 0) return null;

            const typeSelectedCount = typeTerms.filter((term) =>
              selectedTerms.has(term.id),
            ).length;
            const allSelected = typeSelectedCount === typeTerms.length;
            const isExpanded = expandedTypes.has(type);

            return (
              <Collapsible
                key={type}
                open={isExpanded}
                onOpenChange={() => toggleType(type)}
              >
                <div className="border rounded-lg bg-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                        <h2 className="text-lg font-semibold">
                          {typeLabels[type]}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          ({typeSelectedCount}/{typeTerms.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInType(type, !allSelected);
                          }}
                        >
                          {allSelected ? (
                            <>
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Deselect All
                            </>
                          ) : (
                            'Select All'
                          )}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t" />
                    <div className="px-4 pb-4 pt-4 space-y-2">
                      {typeTerms.map((term) => {
                        const isSelected = selectedTerms.has(term.id);
                        return (
                          <div
                            key={term.id}
                            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-md border hover:border-primary/50 transition-colors"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTerm(term.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-mono text-muted-foreground mb-2">
                                ID: {term.id}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {availableLanguages.map((lang) => {
                                  const name = term.translations[lang];
                                  if (!name) return null;
                                  return (
                                    <div
                                      key={lang}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-xs font-medium text-muted-foreground min-w-12">
                                        {languageLabels[lang]}:
                                      </span>
                                      <span className="text-sm truncate">
                                        {name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
