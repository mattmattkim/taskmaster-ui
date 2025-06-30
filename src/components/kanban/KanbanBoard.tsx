'use client';

import { useKanbanColumns } from '@/hooks/useTaskStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanControls } from './KanbanControls';
import { TaskStatus } from '@/types/task';
import { useUI } from '@/hooks/useUIStore';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
} from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { useTasks } from '@/hooks/useTaskStore';
import { useTasksQuery, useUpdateTaskStatusMutation } from '@/hooks/useTasksQuery';

const COLUMN_TITLES: Record<TaskStatus, string> = {
  'pending': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
  'blocked': 'Blocked',
  'deferred': 'Deferred',
  'cancelled': 'Cancelled',
};

const COLUMN_COLORS: Record<TaskStatus, string> = {
  'pending': 'bg-gray-100 dark:bg-gray-800',
  'in-progress': 'bg-blue-50 dark:bg-blue-950',
  'review': 'bg-purple-50 dark:bg-purple-950',
  'done': 'bg-green-50 dark:bg-green-950',
  'blocked': 'bg-red-50 dark:bg-red-950',
  'deferred': 'bg-yellow-50 dark:bg-yellow-950',
  'cancelled': 'bg-gray-50 dark:bg-gray-900',
};

export function KanbanBoard() {
  const columns = useKanbanColumns();
  const { hiddenColumns } = useUI();
  const { setTasks, setTasksLoading, setTasksError, updateTaskStatus } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  
  // Fetch tasks using React Query
  const { data: tasks, isLoading, error } = useTasksQuery();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  
  // Sync tasks with Zustand store
  useEffect(() => {
    setTasksLoading(isLoading);
    if (error) {
      setTasksError(error.message);
    } else {
      setTasksError(null);
    }
    
    if (tasks && Array.isArray(tasks)) {
      setTasks(tasks);
    }
  }, [tasks, isLoading, error, setTasks, setTasksLoading, setTasksError]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTaskId(Number(active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = Number(active.id);
    const dropTargetId = over.id;

    // Check if we're dropping on a valid column (status)
    const validStatuses: TaskStatus[] = ['pending', 'in-progress', 'review', 'done', 'blocked', 'deferred', 'cancelled'];
    
    // If dropping on another task, find the column that contains that task
    let newStatus: TaskStatus;
    if (typeof dropTargetId === 'number') {
      // Dropped on a task - find which column this task belongs to
      const targetTask = Object.values(columns).flat().find(task => task.id === dropTargetId);
      if (!targetTask) {
        console.error('Could not find target task:', dropTargetId);
        return;
      }
      newStatus = targetTask.status;
    } else if (typeof dropTargetId === 'string' && validStatuses.includes(dropTargetId as TaskStatus)) {
      // Dropped on a column
      newStatus = dropTargetId as TaskStatus;
    } else {
      console.error('Invalid drop target:', dropTargetId);
      return;
    }

    // Don't update if the status hasn't changed
    const draggedTask = Object.values(columns).flat().find(task => task.id === taskId);
    if (!draggedTask) {
      console.error('Could not find dragged task:', taskId);
      return;
    }
    
    if (draggedTask.status === newStatus) {
      return;
    }

    // Store the old status for potential rollback
    const oldStatus = draggedTask.status;

    // Optimistically update Zustand store immediately for smooth animation
    updateTaskStatus(taskId, newStatus);

    // Update task status via API
    updateTaskStatusMutation.mutate(
      { id: taskId, status: newStatus },
      {
        onError: () => {
          // Rollback Zustand store on API failure
          updateTaskStatus(taskId, oldStatus);
        }
      }
    );
  };

  const activeTask = activeTaskId
    ? Object.values(columns)
        .flat()
        .find((task) => task.id === activeTaskId)
    : null;
  
  // Filter out hidden columns
  const visibleStatuses = (Object.keys(COLUMN_TITLES) as TaskStatus[])
    .filter(status => !hiddenColumns.includes(status));
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <KanbanControls />
      
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 p-6">
          <div className={`grid gap-4 h-full ${
            visibleStatuses.length === 1 ? 'grid-cols-1' :
            visibleStatuses.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            visibleStatuses.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            visibleStatuses.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            visibleStatuses.length === 5 ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5' :
            visibleStatuses.length === 6 ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6' :
            'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7'
          }`}>
            {visibleStatuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                title={COLUMN_TITLES[status]}
                tasks={columns[status] || []}
                color={COLUMN_COLORS[status]}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 