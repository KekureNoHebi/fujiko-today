'use client';

import type { Database } from '@/lib/types/database';
import { ArrowBigUp, Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useGT } from 'gt-next';

type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];

interface RoadmapCardProps {
  item: RoadmapItem;
  hasVoted: boolean;
  onVote: (
    itemId: number,
    action: 'vote' | 'unvote',
    locale: string,
  ) => Promise<void>;
  locale: string;
}

const typeColors: Record<Database['public']['Enums']['roadmap_type'], string> =
  {
    feature:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    improvement:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    bug_fix: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    research: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

export function RoadmapCard({
  item,
  hasVoted: initialHasVoted,
  onVote,
  locale,
}: RoadmapCardProps) {
  const t = useGT();
  const [voteCount, setVoteCount] = useState(item.vote_count);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  const typeLabels: Record<
    Database['public']['Enums']['roadmap_type'],
    string
  > = {
    feature: t('Feature'),
    improvement: t('Improvement'),
    bug_fix: t('Bug Fix'),
    research: t('Research'),
  };

  const handleVote = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const action = hasVoted ? 'unvote' : 'vote';

    try {
      await onVote(item.id, action, locale);

      setHasVoted(!hasVoted);
      setVoteCount((prev: number) => (hasVoted ? prev - 1 : prev + 1));
      toast.success(hasVoted ? t('Vote cancelled') : t('Vote successful'));
    } catch (error) {
      console.error('Vote error:', error);
      toast.error(t('Vote failed, please try again later'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group relative border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
      {/* Vote button - top right corner */}
      <button
        onClick={handleVote}
        disabled={isLoading}
        className={`absolute top-3 right-3 flex flex-col items-center justify-center w-12 h-16 rounded-lg border-2 transition-all duration-200 ${
          hasVoted
            ? 'bg-linear-to-br from-blue-50 to-blue-100 border-blue-400 dark:from-blue-900/40 dark:to-blue-800/40 dark:border-blue-500 scale-105'
            : 'bg-linear-to-br from-gray-50 to-gray-100 border-gray-300 hover:border-blue-300 hover:scale-105 dark:from-gray-700 dark:to-gray-600 dark:border-gray-600 dark:hover:border-blue-500'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <ArrowBigUp
          className={`w-5 h-5 transition-all ${hasVoted ? 'text-blue-600 dark:text-blue-400 fill-current' : 'text-gray-500 dark:text-gray-400'}`}
        />
        <span
          className={`text-xs font-bold mt-0.5 ${hasVoted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
        >
          {voteCount}
        </span>
      </button>

      {/* Content */}
      <div className="pr-16">
        <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100 leading-tight">
          {item.title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${typeColors[item.type]}`}
          >
            {typeLabels[item.type]}
          </span>
          {item.target_date && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <Calendar className="w-3 h-3" />
              {new Date(item.target_date).toLocaleDateString(locale)}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-400 to-purple-400 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
}
