'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { createFullHalfWidthPattern } from '@/lib/utils/content-helpers';

const availableLanguages = Object.keys(languageLabels) as LanguageCode[];

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

    try {
      const response = await fetch('/api/translate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
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
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)] max-w-7xl mx-auto">
      <Conversation className="h-full">
        <ConversationContent className="gap-4">
          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
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
              <label className="text-sm font-medium">To</label>
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

          {/* Input Section */}
          <div className="space-y-3">
            <Textarea
              placeholder="Enter text to translate..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] resize-none"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard
                    .write([
                      new ClipboardItem({
                        'text/plain': generatePrompt().then((prompt) => {
                          if (!prompt) throw new Error('No prompt generated');
                          return new Blob([prompt], { type: 'text/plain' });
                        }),
                      }),
                    ])
                    .then(() => {
                      toast.success('Prompt copied to clipboard!');
                    })
                    .catch((error) => {
                      toast.error('Failed to copy prompt');
                      console.error('Copy error:', error);
                    });
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
                  const promptToUse = await generatePrompt();
                  if (promptToUse) {
                    await translateWithStream(promptToUse);
                  }
                }}
                disabled={loading || streaming || !text.trim()}
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
          </div>

          {/* Reasoning Process */}
          {thinkingContent && (
            <Reasoning isStreaming={streaming} defaultOpen={true}>
              <ReasoningTrigger />
              <ReasoningContent>{thinkingContent}</ReasoningContent>
            </Reasoning>
          )}

          {/* Translation Result */}
          {translation && (
            <div className="space-y-3">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap wrap-break-word">
                  {translation}
                </div>
              </div>

              {/* Action buttons */}
              {!streaming && (
                <div className="flex gap-2">
                  <Button onClick={copyTranslation} variant="outline" size="sm">
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy Translation
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
