'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Copy } from 'lucide-react';
import { TranslateTermsDialog } from '@/components/term/translate-terms-dialog';
import type { Term, DirectusTerm, AnalysisResult } from '@/lib/types/term';
import { typeColors, typeLabels } from '@/lib/constants/term';
import { analyzeTermsAction, getDirectusTermsAction } from '@/lib/actions/term';
import { toast } from 'sonner';

interface TermAnalyzerProps {
  content: string;
}

export function TermAnalyzer({ content }: TermAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const enrichTermsWithDirectus = (
    terms: Term[],
    directusData: Record<string, DirectusTerm[]>,
  ) => {
    const directusTerms = Object.values(directusData).flat();
    return terms.map((term: Term) => ({
      ...term,
      directusMatches: directusTerms.filter((t) => t.name === term.name),
    }));
  };

  const analyzeContent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [analysisData, directusData] = await Promise.all([
        analyzeTermsAction({ text: content }),
        getDirectusTermsAction('ja'),
      ]);

      const enrichedTerms = enrichTermsWithDirectus(
        analysisData.terms,
        directusData,
      );
      setResult({ terms: enrichedTerms });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshDirectusData = async () => {
    if (!result) return;

    setLoading(true);
    try {
      const directusData = await getDirectusTermsAction('ja');
      const enrichedTerms = enrichTermsWithDirectus(result.terms, directusData);
      setResult({ terms: enrichedTerms });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = (term: Term) => {
    setSelectedTerm(term);
    setDialogOpen(true);
  };

  const generatePrompt = async () => {
    try {
      // Fetch terms from Directus for both languages
      const [jaData, zhData] = await Promise.all([
        getDirectusTermsAction('ja'),
        getDirectusTermsAction('zh-CN'),
      ]);

      const jaTerms = Object.values(jaData).flat();
      const zhTerms = Object.values(zhData).flat();

      // Create a map for quick lookup by ID
      const zhTermMap = new Map(zhTerms.map((term) => [term.id, term.name]));

      let prompt = `Please translate the following Japanese article into Simplified Chinese.

# Translation Guidelines

1. Provide only the translation without explanations or meta-commentary
2. Maintain the original meaning and tone
3. Use natural, fluent Chinese expressions
4. **IMPORTANT**: Use the exact terminology translations provided below - do not translate these terms differently
5. Keep the markdown formatting intact

# Terminology Reference

The following terms must be translated exactly as specified:

`;

      // Generate term list: Japanese -> Chinese
      const termLines = jaTerms
        .map((term) => {
          const zhName = zhTermMap.get(term.id);
          if (!zhName) return null;
          return `- ${term.name} → ${zhName}`;
        })
        .filter((line): line is string => line !== null);

      if (termLines.length > 0) {
        prompt += termLines.join('\n') + '\n\n';
      } else {
        prompt += '(No terminology reference available)\n\n';
      }

      prompt += '# Article to Translate\n\n';
      prompt += content;

      return prompt;
    } catch {
      throw new Error('Failed to fetch terms from Directus');
    }
  };

  const copyPrompt = async () => {
    try {
      setLoading(true);
      const prompt = await generatePrompt();
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to copy prompt');
      console.error('Failed to copy:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupedTerms = result?.terms.reduce(
    (acc, term) => {
      if (!acc[term.type]) {
        acc[term.type] = [];
      }
      acc[term.type].push(term);
      return acc;
    },
    {} as Record<string, Term[]>,
  );

  return (
    <div className="space-y-4 my-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Term Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={analyzeContent} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Terms'
              )}
            </Button>
            <Button onClick={copyPrompt} disabled={loading} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy Prompt
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Found {result.terms.length} terms
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      {
                        result.terms.filter((t) => t.directusMatches?.length)
                          .length
                      }{' '}
                      in Directus
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">
                      {
                        result.terms.filter((t) => !t.directusMatches?.length)
                          .length
                      }{' '}
                      new
                    </span>
                  </div>
                </div>
              </div>

              {groupedTerms &&
                Object.entries(groupedTerms).map(([type, terms]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">
                      {typeLabels[type as keyof typeof typeLabels]} (
                      {terms.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {terms.map((term, index) => (
                        <Badge
                          key={`${term.name}-${index}`}
                          className={`${typeColors[term.type as keyof typeof typeColors]} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
                            term.directusMatches?.length
                              ? 'border-2 border-green-400'
                              : 'opacity-60'
                          }`}
                          onClick={() => handleTermClick(term)}
                        >
                          {term.directusMatches?.length ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {term.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TranslateTermsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        term={selectedTerm}
        onSuccess={refreshDirectusData}
      />
    </div>
  );
}
