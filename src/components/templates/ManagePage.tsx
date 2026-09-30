import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatRow, type StatItem } from '@/components/shared/StatRow';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ListToolbar, type ListToolbarProps } from '@/components/shared/ListToolbar';

export interface ManagePageTab {
  value: string;
  label: string;
  count?: number;
}

export interface ManagePageProps {
  title: string;
  subtitle?: string;
  selectorSlot?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  stats?: StatItem[];
  tabs?: ManagePageTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  toolbar?: ListToolbarProps;
  children: React.ReactNode;
  drawer?: React.ReactNode;
}

/**
 * Khung trang quản lý / xét duyệt (R1, G3, M4, CL5, CL6, PG3, PG4, A2-A8)
 * theo 04-reuse-plan.md § 2.3.3
 */
export const ManagePage: React.FC<ManagePageProps> = ({
  title,
  subtitle,
  selectorSlot,
  primaryAction,
  secondaryAction,
  stats,
  tabs,
  activeTab,
  onTabChange,
  toolbar,
  children,
  drawer,
}) => {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selectorSlot}
            {secondaryAction}
            {primaryAction}
          </div>
        }
      />

      {stats && stats.length > 0 && <StatRow items={stats} />}

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

      <div>{children}</div>

      {drawer}
    </div>
  );
};
