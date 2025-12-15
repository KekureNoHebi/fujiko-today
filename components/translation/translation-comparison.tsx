'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { markdownComponents } from '@/lib/markdown-components';
import type { Model } from '@/app/api/models/route';
import type { LanguageCode } from '@/lib/types/term';
import type { TranslationResult } from '@/lib/types/translation';

interface TranslationComparisonProps {
  content: string;
  targetLocale: LanguageCode;
}

export function TranslationComparison({
  content,
  targetLocale,
}: TranslationComparisonProps) {
  const [expanded, setExpanded] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Map<string, TranslationResult>>(
    new Map(),
  );
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (expanded && models.length === 0) {
      fetch('/api/models')
        .then((res) => res.json())
        .then((data) => setModels(data))
        .catch((err) => console.error('Failed to fetch models:', err));
    }
  }, [expanded, models.length]);

  const filteredModels = models.filter(
    (model) =>
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId],
    );
  };

  const handleSelectAll = () => {
    const filteredModelIds = filteredModels.map((model) => model.id);
    const allFilteredSelected = filteredModelIds.every((id) =>
      selectedModels.includes(id),
    );

    if (allFilteredSelected) {
      // Deselect all filtered models
      setSelectedModels((prev) =>
        prev.filter((id) => !filteredModelIds.includes(id)),
      );
    } else {
      // Select all filtered models
      setSelectedModels((prev) => {
        const newSelection = new Set([...prev, ...filteredModelIds]);
        return Array.from(newSelection);
      });
    }
  };

  const handleTranslate = async () => {
    if (selectedModels.length === 0) return;

    setLoading(true);
    setResults(new Map());
    setCompletedCount(0);

    // Initialize all models with loading state
    const initialResults = new Map<string, TranslationResult>();
    selectedModels.forEach((model) => {
      initialResults.set(model, {
        model,
        result: '',
        error: undefined,
      });
    });
    setResults(new Map(initialResults));

    try {
      // Use streaming API for parallel translations with real-time updates
      const response = await fetch('/api/translate-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          targetLocale,
          models: selectedModels,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start translation');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            const result: TranslationResult = JSON.parse(data);

            // Update result immediately when received
            setResults((prev) => {
              const newResults = new Map(prev);
              newResults.set(result.model, result);
              return newResults;
            });

            setCompletedCount((prev) => prev + 1);
          }
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Mark all pending translations as failed
      setResults((prev) => {
        const newResults = new Map(prev);
        for (const [model, result] of newResults) {
          if (!result.result && !result.error) {
            newResults.set(model, {
              ...result,
              error: 'Translation failed',
            });
          }
        }
        return newResults;
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => setExpanded(!expanded)}
        className="w-full"
      >
        {expanded ? 'Hide' : 'Show'} Translation Comparison
      </Button>

      {expanded && (
        <div className="space-y-4 border rounded-lg p-4 sm:p-6 bg-card">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Translation Model Comparison
            </h3>

            {/* Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredModels.length === 0}
                >
                  {filteredModels.every((model) =>
                    selectedModels.includes(model.id),
                  ) && filteredModels.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <Badge variant="secondary">
                  {selectedModels.length} selected
                </Badge>
              </div>

              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                      selectedModels.includes(model.id) ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {model.id}
                        </div>
                      </div>
                      {selectedModels.includes(model.id) && (
                        <Badge variant="default" className="ml-2">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Translate Button */}
            <Button
              onClick={handleTranslate}
              disabled={selectedModels.length === 0 || loading}
              className="w-full"
            >
              {loading
                ? `Translating... (${completedCount}/${selectedModels.length})`
                : `Translate with ${selectedModels.length} model(s)`}
            </Button>

            {/* Results */}
            {results.size > 0 && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Results:</div>
                  {loading && (
                    <Badge variant="secondary">
                      {completedCount}/{selectedModels.length} completed
                    </Badge>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 min-w-max pb-2">
                    {Array.from(results.values()).map((result) => (
                      <Card
                        key={result.model}
                        className="p-4 sm:p-6 w-[400px] shrink-0"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge variant="outline" className="text-sm">
                              {result.model}
                            </Badge>
                            {result.error ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : !result.result ? (
                              <Badge variant="secondary">Translating...</Badge>
                            ) : (
                              <Badge variant="default">Completed</Badge>
                            )}
                          </div>
                          {result.error ? (
                            <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
                              {result.error}
                            </div>
                          ) : result.result ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                components={markdownComponents}
                                remarkPlugins={[remarkBreaks]}
                              >
                                {result.result}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Waiting for translation...
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
