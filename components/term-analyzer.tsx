'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Term {
  name: string;
  type: 'character' | 'person' | 'work' | 'other';
}

interface AnalysisResult {
  terms: Term[];
}

interface TermAnalyzerProps {
  content: string;
}

const typeColors = {
  character: 'bg-blue-500',
  person: 'bg-green-500',
  work: 'bg-purple-500',
  object: 'bg-yellow-500',
  other: 'bg-gray-500',
};

const typeLabels = {
  character: 'Character',
  person: 'Person',
  work: 'Work',
  object: 'Object',
  other: 'Other',
};

export function TermAnalyzer({ content }: TermAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
              <div className="text-sm text-muted-foreground">
                Found {result.terms.length} terms
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
                          className={
                            typeColors[term.type as keyof typeof typeColors]
                          }
                        >
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
    </div>
  );
}
