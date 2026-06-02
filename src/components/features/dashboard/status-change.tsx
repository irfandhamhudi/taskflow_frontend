// src/features/dashboard/components/StatusPriorityChangeBadge.tsx
import type { JSX } from 'react';
import { ArrowRight } from 'lucide-react';
import { priorityConfig, statusConfig } from '../../../types/index';
import { getRealChanges, normalizeKey } from '../../../utils/activityUtils';
import type { DashboardData } from '../../../types/dashboard';

type StatusPriorityChangeBadgeProps = {
  act: DashboardData['recentActivity'][number];
};

export function StatusPriorityChangeBadge({ act }: StatusPriorityChangeBadgeProps): JSX.Element | null {
  const { action, details = {} } = act;

  let oldValue: string | undefined;
  let newValue: string | undefined;
  let isPriorityChange = false;

  if (action === 'task_priority_changed') {
    oldValue = details.oldValue;
    newValue = details.newValue;
    isPriorityChange = true;
  } else if (action === 'task_status_changed') {
    oldValue = details.oldValue;
    newValue = details.newValue;
  } else if (action === 'task_updated') {
    const realChanges = getRealChanges(details.changes);
    if (!realChanges.length) return null;

    const priorityCh = realChanges.find((c) => c.field === 'priority');
    const statusCh = realChanges.find((c) => c.field === 'status');

    if (priorityCh) {
      oldValue = priorityCh.oldValue;
      newValue = priorityCh.newValue;
      isPriorityChange = true;
    } else if (statusCh) {
      oldValue = statusCh.oldValue;
      newValue = statusCh.newValue;
    }
  }

  if (oldValue == null || newValue == null) return null;

  const config = isPriorityChange ? priorityConfig : statusConfig;
  const oldKey = normalizeKey(oldValue) as keyof typeof config;
  const newKey = normalizeKey(newValue) as keyof typeof config;

  const oldStyle =
    config[oldKey]?.className ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const newStyle =
    config[newKey]?.className ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  const oldLabel = config[oldKey]?.label || oldValue;
  const newLabel = config[newKey]?.label || newValue;

  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className={`px-2 py-1 rounded font-medium text-[11px] mr-1.5 shadow border border-border/40 ${oldStyle}`}>
        {oldLabel}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground/70" />
      <span className={`px-2 py-1 rounded font-medium text-[11px] ml-1.5 shadow border border-border/40 ${newStyle}`}>
        {newLabel}
      </span>
    </span>
  );
}

