'use client';

import { useUI } from '@/hooks/useUIStore';
import { useKanbanColumns } from '@/hooks/useTaskStore';
import { TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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
  const { hiddenColumns, toggleColumnVisibility, setHiddenColumns } = useUI();

  const columns = useKanbanColumns();

  const allStatuses = Object.keys(COLUMN_TITLES) as TaskStatus[];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 border-b">
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
            // Find all columns that are actually empty
            const emptyColumns = allStatuses.filter((status) => columns[status].length === 0);
            setHiddenColumns(emptyColumns);
          }}
          className="text-xs"
        >
          Hide Empty
        </Button>
      </div>
    </div>
  );
}
