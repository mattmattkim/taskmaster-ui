'use client';

import { Task } from '@/types/task';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskDetail, useUI } from '@/hooks/useUIStore';
import { CheckCircle2, Clock, AlertCircle, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-green-500',
};

const PRIORITY_BADGES = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const { setSelectedTaskId } = useTaskDetail();
  const { groupByParentTask } = useUI();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if this is a placeholder task (negative ID)
  const isPlaceholder = task.id < 0;
  const actualTaskId = isPlaceholder ? Math.abs(task.id) : task.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : isPlaceholder ? 0.4 : 1,
  };

  const handleClick = () => {
    // Don't allow clicking on placeholder tasks
    if (isPlaceholder) return;
    setSelectedTaskId(actualTaskId);
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.status === 'done').length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const showSubtasks = groupByParentTask && hasSubtasks && !isPlaceholder;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer
        hover:shadow-md transition-shadow
        ${PRIORITY_COLORS[task.priority]}
        ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}
        ${isPlaceholder ? 'ring-2 ring-primary/30 bg-primary/5' : ''}
      `}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 flex-1">
            {showSubtasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_BADGES[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Task ID */}
            <span className="font-mono">#{actualTaskId}</span>

            {/* Dependencies */}
            {task.dependencies.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{task.dependencies.length}</span>
              </div>
            )}

            {/* Subtasks */}
            {hasSubtasks && (
              <div className="flex items-center gap-1">
                {completedSubtasks === totalSubtasks ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}
          </div>

          {/* Status indicator for blocked tasks */}
          {task.status === 'blocked' && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>

        {/* Subtasks */}
        {showSubtasks && isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="space-y-2">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      subtask.status === 'done'
                        ? 'bg-green-500'
                        : subtask.status === 'in-progress'
                          ? 'bg-blue-500'
                          : subtask.status === 'blocked'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                    }`}
                  />
                  <span className="flex-1 line-clamp-1">{subtask.title}</span>
                  <span className="text-muted-foreground">
                    #{actualTaskId}.{subtask.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
