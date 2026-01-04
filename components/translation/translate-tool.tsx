'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UtensilsCrossed, Copy, ArrowLeftRight } from 'lucide-react';
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
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import { getDirectusTermsAction } from '@/lib/actions/term';
import { languageLabels, languageNames } from '@/lib/constants/term';
import type { LanguageCode } from '@/lib/types/term';
import {
  replaceTermsWithPlaceholders,
  replacePlaceholders,
} from '@/lib/utils/content-helpers';
import { generateTranslationPrompt } from '@/lib/utils/translation-prompt';
import { useGT, T } from 'gt-next';
const availableLanguages = Object.keys(languageLabels) as LanguageCode[];

interface TranslateToolProps {
  locale?: LanguageCode;
}

export function TranslateTool({ locale }: TranslateToolProps) {
  const t = useGT();
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('ja');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    locale || 'en',
  );
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const translateWithStream = async () => {
    if (!text.trim()) {
      toast.error(t('Please enter text to translate'));
      return;
    }

    setStreaming(true);
    setTranslation('');
    setThinkingContent('');

    try {
      const [sourceData, targetData] = await Promise.all([
        getDirectusTermsAction(sourceLanguage),
        getDirectusTermsAction(targetLanguage),
      ]);

      const sourceTerms = Object.values(sourceData).flat();
      const textWithPlaceholders = replaceTermsWithPlaceholders(
        text,
        sourceTerms,
      );

      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      const response = await fetch('/api/translate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textWithPlaceholders,
          targetLanguageName: targetLangName,
          enableThinking,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let rawTranslationAccumulator = '';

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

              if (delta?.reasoning) {
                setThinkingContent((prev) => prev + delta.reasoning);
              }

              if (delta?.content) {
                rawTranslationAccumulator += delta.content;
                const processed = replacePlaceholders(
                  rawTranslationAccumulator,
                  targetData,
                );
                setTranslation(processed);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Oops, the Translation Gummy seems to have gone bad...'),
      );
      console.error('Translation error:', error);
    } finally {
      setStreaming(false);
    }
  };

  const copyTranslation = async () => {
    if (!translation) {
      toast.error(t('No translation to copy'));
      return;
    }

    try {
      await navigator.clipboard.writeText(translation);
      toast.success(t('Translation copied to clipboard!'));
    } catch (error) {
      toast.error(t('Failed to copy translation'));
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)] max-w-7xl mx-auto">
      <Conversation className="h-full">
        <ConversationContent className="gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 max-w-md">
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

            <Button
              variant="ghost"
              size="icon"
              onClick={swapLanguages}
              className="shrink-0"
              aria-label="Swap languages"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

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

          <div className="space-y-3">
            <Textarea
              placeholder={t('Enter text to translate...')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-none"
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-thinking"
                checked={enableThinking}
                onCheckedChange={(checked: boolean) =>
                  setEnableThinking(checked === true)
                }
              />
              <label
                htmlFor="enable-thinking"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <T>I want one this big! (Better translation)</T>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={async () => {
                  if (!text.trim()) {
                    toast.error(t('Please enter text to translate'));
                    return;
                  }

                  setLoading(true);
                  try {
                    const prompt = await generateTranslationPrompt({
                      sourceLanguage,
                      targetLanguage,
                      text,
                    });
                    await navigator.clipboard.writeText(prompt);
                    toast.success(t('Recipe copied to clipboard!'));
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t('Failed to copy recipe'),
                    );
                    console.error('Copy error:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !text.trim()}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <T>Generating...</T>
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    <T>Copy Recipe</T>
                  </>
                )}
              </Button>

              <Button
                onClick={translateWithStream}
                disabled={loading || streaming || !text.trim()}
              >
                {streaming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <T>Eating...</T>
                  </>
                ) : (
                  <>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    <T>Let&apos;s eat!</T>
                  </>
                )}
              </Button>
            </div>
          </div>

          {!translation && !thinkingContent && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Image
                src="/translation-gummy.png"
                alt="Translation Gummy"
                width={150}
                height={150}
              />
              <p className="text-sm text-muted-foreground text-center">
                <T>
                  Enter the text you want to translate, then let&apos;s eat!
                </T>
              </p>
            </div>
          )}

          {thinkingContent && (
            <div className="w-full min-w-0 overflow-hidden">
              <Reasoning isStreaming={streaming} defaultOpen={true}>
                <ReasoningTrigger />
                <ReasoningContent>{thinkingContent}</ReasoningContent>
              </Reasoning>
            </div>
          )}

          {translation && (
            <div className="space-y-3">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap wrap-break-word min-h-8">
                  {translation}
                  {streaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
              </div>

              {!streaming && translation.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={copyTranslation} variant="outline" size="sm">
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    <T>Copy Translation</T>
                  </Button>
                </div>
              )}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}
