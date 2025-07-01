'use client';

import { useUI } from '@/hooks/useUIStore';
import { TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Group, Ungroup } from 'lucide-react';

const COLUMN_TITLES: Record<TaskStatus, string> = {
  pending: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
  blocked: 'Blocked',
  deferred: 'Deferred',
  cancelled: 'Cancelled',
};

export function KanbanControls() {
  const {
    hiddenColumns,
    groupByParentTask,
    toggleColumnVisibility,
    setGroupByParentTask,
    setHiddenColumns,
  } = useUI();

  const allStatuses = Object.keys(COLUMN_TITLES) as TaskStatus[];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 border-b">
      {/* Grouping Toggle */}
      <div className="flex items-center gap-2 mr-4">
        <Button
          variant={groupByParentTask ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGroupByParentTask(!groupByParentTask)}
          className="flex items-center gap-2"
        >
          {groupByParentTask ? <Group className="h-4 w-4" /> : <Ungroup className="h-4 w-4" />}
          {groupByParentTask ? 'Grouped' : 'Flat View'}
        </Button>
      </div>

      {/* Column Visibility Toggles */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground mr-2">Columns:</span>
        {allStatuses.map((status) => {
          const isHidden = hiddenColumns.includes(status);
          return (
            <Button
              key={status}
              variant={isHidden ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => toggleColumnVisibility(status)}
              className="flex items-center gap-1 text-xs"
            >
              {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {COLUMN_TITLES[status]}
            </Button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Show all columns
            setHiddenColumns([]);
          }}
          className="text-xs"
        >
          Show All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Hide empty columns (you can implement this logic)
            // For now, just hide cancelled and deferred as they're often empty
            setHiddenColumns(['cancelled', 'deferred']);
          }}
          className="text-xs"
        >
          Hide Empty
        </Button>
      </div>
    </div>
  );
}
