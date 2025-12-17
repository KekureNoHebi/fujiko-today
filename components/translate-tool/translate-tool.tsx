'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Sparkles,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDirectusTermsAction } from '@/lib/actions/term';
import { languageLabels, languageNames } from '@/lib/constants/term';
import type { LanguageCode } from '@/lib/types/term';
import { createFullHalfWidthPattern } from '@/lib/utils/content-helpers';

const availableLanguages = Object.keys(languageLabels) as LanguageCode[];

// Scroll detection thresholds
const SCROLL_UP_THRESHOLD = 10; // pixels scrolled up to trigger "user scrolled up"
const NEAR_BOTTOM_THRESHOLD = 50; // pixels from bottom to consider "at bottom" for thinking area
const PAGE_BOTTOM_THRESHOLD = 100; // pixels from bottom to consider "at bottom" for page

interface TranslateToolProps {
  locale?: LanguageCode;
}

export function TranslateTool({ locale }: TranslateToolProps) {
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [translation, setTranslation] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('ja');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    locale || 'en',
  );
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const thinkingRef = useRef<HTMLDivElement>(null);
  const prevTranslationLength = useRef(0);
  const userScrolledUp = useRef(false);
  const lastScrollY = useRef(0);
  const thinkingUserScrolledUp = useRef(false);
  const lastThinkingScrollTop = useRef(0);

  // Auto-scroll thinking content to bottom when it updates (if expanded and user hasn't scrolled up)
  useEffect(() => {
    if (
      streaming &&
      thinkingContent &&
      isThinkingExpanded &&
      thinkingRef.current
    ) {
      if (!thinkingUserScrolledUp.current) {
        thinkingRef.current.scrollTo({
          top: thinkingRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    // Reset when thinking content is cleared
    if (!thinkingContent) {
      thinkingUserScrolledUp.current = false;
    }
  }, [thinkingContent, streaming, isThinkingExpanded]);

  // Handle thinking area scroll event
  const handleThinkingScroll = useCallback(() => {
    if (!thinkingRef.current || !streaming) return;
    const { scrollTop, scrollHeight, clientHeight } = thinkingRef.current;
    // User scrolled up manually
    if (scrollTop < lastThinkingScrollTop.current - SCROLL_UP_THRESHOLD) {
      thinkingUserScrolledUp.current = true;
    }
    // If user scrolls back to bottom, re-enable auto-scroll
    if (scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD) {
      thinkingUserScrolledUp.current = false;
    }
    lastThinkingScrollTop.current = scrollTop;
  }, [streaming]);

  // Scroll to bottom when thinking is first expanded
  useEffect(() => {
    if (isThinkingExpanded && thinkingRef.current) {
      thinkingUserScrolledUp.current = false;
      setTimeout(() => {
        if (thinkingRef.current) {
          thinkingRef.current.scrollTo({
            top: thinkingRef.current.scrollHeight,
            behavior: 'smooth',
          });
          lastThinkingScrollTop.current = thinkingRef.current.scrollTop;
        }
      }, 100);
    }
  }, [isThinkingExpanded]);

  // Check if page is near bottom
  const isPageAtBottom = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    return scrollHeight - scrollTop - clientHeight < PAGE_BOTTOM_THRESHOLD;
  }, []);

  // Detect user manual scroll up to stop auto-scrolling
  useEffect(() => {
    if (!streaming) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // User scrolled up manually
      if (currentScrollY < lastScrollY.current - SCROLL_UP_THRESHOLD) {
        userScrolledUp.current = true;
      }
      // If user scrolls back to bottom, re-enable auto-scroll
      if (isPageAtBottom()) {
        userScrolledUp.current = false;
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [streaming, isPageAtBottom]);

  // Auto-scroll to page bottom when streaming (unless user scrolled up)
  useEffect(() => {
    if (streaming && translation) {
      // Reset userScrolledUp when translation first starts
      if (prevTranslationLength.current === 0 && translation.length > 0) {
        userScrolledUp.current = false;
        lastScrollY.current = window.scrollY;
      }

      if (!userScrolledUp.current) {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      }

      prevTranslationLength.current = translation.length;
    }

    // Reset when translation is cleared
    if (!translation) {
      prevTranslationLength.current = 0;
      userScrolledUp.current = false;
    }
  }, [translation, streaming]);

  const generatePrompt = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to translate');
      return '';
    }

    setLoading(true);
    setPrompt('');

    try {
      const [sourceData, targetData] = await Promise.all([
        getDirectusTermsAction(sourceLanguage),
        getDirectusTermsAction(targetLanguage),
      ]);

      const sourceTerms = Object.values(sourceData).flat();
      const targetTerms = Object.values(targetData).flat();

      const targetTermMap = new Map(
        targetTerms.map((term) => [term.id, term.name]),
      );

      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      let generatedPrompt = `Please translate the following ${sourceLangName} text into ${targetLangName}.

1. Provide only the translation without explanations or meta-commentary
2. Maintain the original meaning and tone
3. Use natural, fluent expressions
4. **IMPORTANT**: Use the exact terminology translations provided below - do not translate these terms differently
5. Keep the markdown formatting intact

The following terms must be translated exactly as specified:

`;

      const termLines = sourceTerms
        .map((term) => {
          const targetName = targetTermMap.get(term.id);
          if (!targetName) return null;
          const pattern = createFullHalfWidthPattern(term.name);
          const regex = new RegExp(pattern);
          if (!regex.test(text)) return null;
          return `- ${term.name} → ${targetName}`;
        })
        .filter((line): line is string => line !== null);

      if (termLines.length > 0) {
        generatedPrompt += termLines.join('\n') + '\n\n';
      } else {
        generatedPrompt += '(No terminology reference available)\n\n';
      }

      generatedPrompt += 'Text to Translate:\n\n';
      generatedPrompt += text;

      setPrompt(generatedPrompt);
      return generatedPrompt;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate prompt',
      );
      console.error('Generate prompt error:', error);
      return '';
    } finally {
      setLoading(false);
    }
  };

  const translateWithStream = async (promptToUse?: string) => {
    const finalPrompt = promptToUse || prompt;

    if (!finalPrompt) {
      toast.error('Generate a prompt first');
      return;
    }

    setStreaming(true);
    setTranslation('');
    setThinkingContent('');
    setIsThinkingExpanded(false);

    try {
      const response = await fetch('/api/translate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, enableThinking }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              // Handle reasoning content (thinking process)
              if (delta?.reasoning_content) {
                setThinkingContent((prev) => prev + delta.reasoning_content);
              }

              // Handle actual response content
              if (delta?.content) {
                setTranslation((prev) => prev + delta.content);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Translation failed',
      );
      console.error('Translation error:', error);
    } finally {
      setStreaming(false);
    }
  };

  const copyTranslation = async () => {
    if (!translation) {
      toast.error('No translation to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(translation);
      toast.success('Translation copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy translation');
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      {/* Language Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Source Language
            </label>
            <Select
              value={sourceLanguage}
              onValueChange={(value) =>
                setSourceLanguage(value as LanguageCode)
              }
            >
              <SelectTrigger>
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Language
            </label>
            <Select
              value={targetLanguage}
              onValueChange={(value) =>
                setTargetLanguage(value as LanguageCode)
              }
            >
              <SelectTrigger>
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
      </div>

      {/* Input Text */}
      <div className="space-y-4">
        <Textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] font-mono resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const generatedPrompt = await generatePrompt();
                if (generatedPrompt) {
                  try {
                    await navigator.clipboard.writeText(generatedPrompt);
                    toast.success('Prompt copied to clipboard!');
                  } catch (error) {
                    toast.error('Failed to copy prompt');
                    console.error('Copy error:', error);
                  }
                }
              }}
              disabled={loading || !text.trim()}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Prompt
                </>
              )}
            </Button>
            <Button
              onClick={async () => {
                let promptToUse = prompt;
                if (!promptToUse) {
                  promptToUse = await generatePrompt();
                }
                if (promptToUse) {
                  await translateWithStream(promptToUse);
                }
              }}
              disabled={loading || streaming || !text.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {streaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Translate
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableThinking"
              checked={enableThinking}
              onChange={(e) => setEnableThinking(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="enableThinking"
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
            >
              Show reasoning process
            </label>
          </div>
        </div>
      </div>

      {/* Result Area - Thinking and Translation in same container */}
      {(thinkingContent || translation) && (
        <div className="space-y-4">
          {/* Thinking Process */}
          {thinkingContent && (
            <div className="space-y-2">
              {/* Thinking header */}
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity py-1"
                onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {streaming ? 'Thinking...' : 'Thought for a moment'}
                </span>
                {isThinkingExpanded ? (
                  <ChevronUp className="h-3 w-3 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                )}
              </div>

              {/* Thinking content - only visible when expanded */}
              {isThinkingExpanded && (
                <div
                  ref={thinkingRef}
                  onScroll={handleThinkingScroll}
                  className="pl-6 max-h-[250px] overflow-y-auto overflow-x-hidden"
                >
                  <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 m-0">
                    {thinkingContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Translation Result */}
          {translation && (
            <div className="overflow-x-hidden">
              <div className="whitespace-pre-wrap break-all text-gray-900 dark:text-gray-100 leading-relaxed">
                {translation}
              </div>
            </div>
          )}

          {/* Copy button */}
          {translation && !streaming && (
            <div className="flex gap-2 pt-2">
              <Button onClick={copyTranslation} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy Translation
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
