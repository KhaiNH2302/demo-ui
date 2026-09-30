import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ListToolbar, type ListToolbarProps } from '@/components/shared/ListToolbar';
import { ActiveFilterChips, type ActiveFilterItem } from '@/components/shared/ActiveFilterChips';
import { LoadingSkeleton, type LoadingSkeletonProps } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';

export interface ModuleListPageTab {
  value: string;
  label: string;
  count?: number;
}

export interface ModuleListPageProps {
  title: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tabs?: ModuleListPageTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  toolbar?: ListToolbarProps;
  activeFilters?: {
    items: ActiveFilterItem[];
    onRemove: (key: string) => void;
    onClearAll: () => void;
  };
  aiRecommendationSlot?: React.ReactNode;
  loading?: boolean;
  skeletonVariant?: LoadingSkeletonProps['variant'];
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  pagination?: React.ReactNode;
}

/**
 * Khung trang khám phá / danh sách module (K1, G1, M1, S1, CL1, PG1, E1)
 * theo 04-reuse-plan.md § 2.3.1
 */
export const ModuleListPage: React.FC<ModuleListPageProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  tabs,
  activeTab,
  onTabChange,
  toolbar,
  activeFilters,
  aiRecommendationSlot,
  loading = false,
  skeletonVariant = 'card-grid',
  error,
  onRetry,
  isEmpty = false,
  emptyState,
  children,
  rightRail,
  pagination,
}) => {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={subtitle}
        actions={
          primaryAction || secondaryAction ? (
            <div className="flex items-center gap-2">
              {secondaryAction}
              {primaryAction}
            </div>
          ) : undefined
        }
      />

      {tabs && tabs.length > 0 && activeTab && onTabChange && (
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.count !== undefined ? ` (${t.count})` : ''}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {toolbar && <ListToolbar {...toolbar} />}

      {activeFilters && activeFilters.items.length > 0 && (
        <ActiveFilterChips
          filters={activeFilters.items}
          onRemove={activeFilters.onRemove}
          onClearAll={activeFilters.onClearAll}
        />
      )}

      {aiRecommendationSlot}

      <div
        className={
          rightRail
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
            : 'space-y-4'
        }
      >
        <div className={rightRail ? 'xl:col-span-8 space-y-4' : 'space-y-4'}>
          {loading ? (
            <LoadingSkeleton variant={skeletonVariant} count={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : isEmpty && emptyState ? (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              action={emptyState.action}
            />
          ) : (
            children
          )}

          {!loading && !error && !isEmpty && pagination}
        </div>

        {rightRail && (
          <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-20">
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
};
