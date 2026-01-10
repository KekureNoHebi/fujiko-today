'use client';

import type { Database } from '@/lib/types/database';
import { RoadmapCard } from './roadmap-card';
import { useGT } from 'gt-next';
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row'];
type RoadmapStatus = Database['public']['Enums']['roadmap_status'];

interface RoadmapBoardProps {
  items: RoadmapItem[];
  votedItems: Set<number>;
  onVote: (
    itemId: number,
    action: 'vote' | 'unvote',
    locale: string,
  ) => Promise<void>;
  locale: string;
}

const statusConfig: Record<
  RoadmapStatus,
  {
    label: string;
    bgColor: string;
    borderColor: string;
    icon: LucideIcon;
    iconColor: string;
  }
> = {
  planned: {
    label: 'Planned',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: ClipboardList,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: Loader2,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
    icon: XCircle,
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

export function RoadmapBoard({
  items,
  votedItems,
  onVote,
  locale,
}: RoadmapBoardProps) {
  const t = useGT();

  const statusLabels: Record<RoadmapStatus, string> = {
    planned: t('Planned'),
    in_progress: t('In Progress'),
    completed: t('Completed'),
    cancelled: t('Cancelled'),
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = [];
      }
      acc[item.status].push(item);
      return acc;
    },
    {} as Record<RoadmapStatus, RoadmapItem[]>,
  );

  const statuses: RoadmapStatus[] = [
    'planned',
    'in_progress',
    'completed',
    'cancelled',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statuses.map((status) => {
        const config = statusConfig[status];
        const statusItems = groupedItems[status] || [];
        const IconComponent = config.icon;

        return (
          <div key={status} className="flex flex-col">
            {/* Column Header */}
            <div
              className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4 mb-4 sticky top-0 z-10 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {statusLabels[status]}
                  </h2>
                </div>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {statusItems.length}
                </span>
              </div>
            </div>

            {/* Column Items */}
            <div className="flex-1 space-y-3 min-h-[200px]">
              {statusItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                  {t('No items')}
                </div>
              ) : (
                statusItems.map((item) => (
                  <RoadmapCard
                    key={item.id}
                    item={item}
                    hasVoted={votedItems.has(item.id)}
                    onVote={onVote}
                    locale={locale}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
