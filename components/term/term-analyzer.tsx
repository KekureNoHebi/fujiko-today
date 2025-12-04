'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Copy, Check } from 'lucide-react';
import { TranslateTermsDialog } from '@/components/term/translate-terms-dialog';
import type { Term, DirectusTerm, AnalysisResult } from '@/lib/types/term';
import { typeColors, typeLabels } from '@/lib/constants/term';
import { replaceTermsWithPlaceholders } from '@/lib/services/translation/replace-terms';
import { analyzeTermsAction, getDirectusTermsAction } from '@/lib/actions/term';

interface TermAnalyzerProps {
  content: string;
}

export function TermAnalyzer({ content }: TermAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
        getDirectusTermsAction(),
      ]);

      const enrichedTerms = enrichTermsWithDirectus(
        analysisData.terms,
        directusData,
      );
      setResult({ terms: enrichedTerms });

      const directusTerms = Object.values(directusData).flat();
      const processed = replaceTermsWithPlaceholders(content, directusTerms);
      setProcessedContent(processed);
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
      const directusData = await getDirectusTermsAction();
      const enrichedTerms = enrichTermsWithDirectus(result.terms, directusData);
      setResult({ terms: enrichedTerms });

      const directusTerms = Object.values(directusData).flat();
      const processed = replaceTermsWithPlaceholders(content, directusTerms);
      setProcessedContent(processed);
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

      {processedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Processed Content with Placeholders</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {processedContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <TranslateTermsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        term={selectedTerm}
        onSuccess={refreshDirectusData}
      />
    </div>
  );
}
