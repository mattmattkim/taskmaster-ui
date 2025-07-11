'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  isHighlighted?: boolean;
  draggedTaskId?: number | null;
  dropPosition?: { taskId: number; above: boolean } | null;
}

export function KanbanColumn({
  status,
  title,
  tasks,
  color,
  isHighlighted,
  draggedTaskId,
  dropPosition,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Use only real task IDs for SortableContext
  const sortableIds = tasks.filter((task) => task.id > 0).map((task) => task.id);

  // Filter out the currently dragged task from this column's display
  const visibleTasks = tasks.filter((task) => task.id !== draggedTaskId);

  // Drop zone placeholder
  const DropZone = () => (
    <div className="h-2 mx-2 my-1 border-2 border-dashed border-primary/50 bg-primary/10 rounded" />
  );

  // Render tasks with drop zone
  const renderTasksWithDropZone = () => {
    if (visibleTasks.length === 0) {
      return isHighlighted ? (
        <DropZone />
      ) : (
        <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg mx-2">
          Drop tasks here
        </div>
      );
    }

    const elements: React.JSX.Element[] = [];

    visibleTasks.forEach((task, _index) => {
      // Add drop zone above this task if needed
      if (dropPosition?.taskId === task.id && dropPosition.above) {
        elements.push(<DropZone key={`drop-above-${task.id}`} />);
      }

      // Add the task
      elements.push(<TaskCard key={task.id} task={task} />);

      // Add drop zone below this task if needed
      if (dropPosition?.taskId === task.id && !dropPosition.above) {
        elements.push(<DropZone key={`drop-below-${task.id}`} />);
      }
    });

    return elements;
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col rounded-lg p-4 h-full min-h-0
        ${color}
        ${isOver || isHighlighted ? 'ring-2 ring-primary ring-opacity-50' : ''}
        transition-all duration-200
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 px-2 pb-4">
            {renderTasksWithDropZone()}
            <div className="h-16 w-full" /> {/* Extra drop space at bottom */}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
