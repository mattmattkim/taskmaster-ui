'use client';

import { Task, TaskStatus } from '@/types/task';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

export function KanbanColumn({ status, title, tasks, color }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-lg p-4 h-full min-h-[200px]
        ${color}
        ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}
        transition-all duration-200
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[150px] p-2">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                Drop tasks here
              </div>
            ) : (
              <>
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <div className="h-8 w-full" /> {/* Extra drop space at bottom */}
              </>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
} 