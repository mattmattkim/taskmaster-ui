'use client';

import { KanbanControls } from './KanbanControls';
import { KanbanColumn } from './KanbanColumn';
import { useUI } from '@/hooks/useUIStore';
import { useKanbanColumns } from '@/hooks/useTaskStore';
import { TaskStatus } from '@/types/task';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
  const { hiddenColumns } = useUI();
  const columns = useKanbanColumns();
  const { updateTaskStatus, reorderTasks, moveTaskToPosition, setTasks, setTasksLoading, setTasksError } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
  const [lastTaskOverId, setLastTaskOverId] = useState<number | null>(null);
  
  // Fetch tasks using React Query
  const { data: tasks, isLoading, error } = useTasksQuery();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();

  // Sync React Query data with Zustand store
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
        distance: 3,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTaskId(Number(active.id));
    setDraggedOverColumn(null);
    setLastTaskOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (!over) {
      setDraggedOverColumn(null);
      return;
    }

    const validStatuses: TaskStatus[] = ['pending', 'in-progress', 'review', 'done', 'blocked', 'deferred', 'cancelled'];
    
    // Debug logging to check coordinate accuracy
    console.log('Drag over:', {
      overId: over.id,
      overRect: over.rect,
      clientX: event.activatorEvent ? (event.activatorEvent as any).clientX : 'unknown',
      clientY: event.activatorEvent ? (event.activatorEvent as any).clientY : 'unknown'
    });
    
    if (typeof over.id === 'string' && validStatuses.includes(over.id as TaskStatus)) {
      setDraggedOverColumn(over.id as TaskStatus);
    } else if (typeof over.id === 'number') {
      // Find which column this task belongs to
      const targetTask = Object.values(columns).flat().find(task => task.id === over.id);
      if (targetTask) {
        setDraggedOverColumn(targetTask.status);
      }
      setLastTaskOverId(over.id as number);
    } else {
      setDraggedOverColumn(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setDraggedOverColumn(null);

    if (!over) return;

    const sourceTaskId = Number(active.id);
    const validStatuses: TaskStatus[] = ['pending', 'in-progress', 'review', 'done', 'blocked', 'deferred', 'cancelled'];
    
    // Find the dragged task
    const draggedTask = Object.values(columns).flat().find(task => task.id === sourceTaskId);
    if (!draggedTask) {
      console.error('Could not find dragged task:', sourceTaskId);
      return;
    }

    let newStatus: TaskStatus;
    let targetTaskId: number | null = null;
    let insertAbove = true;

    if (typeof over.id === 'number') {
      // Dropped on another task
      const targetTask = Object.values(columns).flat().find(task => task.id === over.id);
      if (!targetTask) {
        console.error('Could not find target task:', over.id);
        return;
      }
      newStatus = targetTask.status;
      targetTaskId = over.id;
      
      // Calculate drop position based on current mouse position
      if (over.rect && event.delta) {
        // Calculate current mouse position from activator position + delta
        const activatorY = event.activatorEvent && 'clientY' in event.activatorEvent 
          ? (event.activatorEvent as MouseEvent).clientY 
          : over.rect.top + over.rect.height / 2;
        const currentMouseY = activatorY + event.delta.y;
        const taskCenterY = over.rect.top + over.rect.height / 2;
        insertAbove = currentMouseY < taskCenterY;
        
        console.log('Mouse position debug:', {
          activatorY,
          deltaY: event.delta.y,
          currentMouseY,
          taskCenterY,
          taskTop: over.rect.top,
          taskHeight: over.rect.height,
          insertAbove
        });
      }
    } else if (typeof over.id === 'string' && validStatuses.includes(over.id as TaskStatus)) {
      // Dropped on a column (goes to end or relative to last hovered task)
      newStatus = over.id as TaskStatus;
      if (draggedTask.status === newStatus && lastTaskOverId) {
        targetTaskId = lastTaskOverId;
      }
    } else {
      console.error('Invalid drop target:', over.id);
      return;
    }

    console.log('Drop event:', {
      sourceTaskId,
      draggedTaskStatus: draggedTask.status,
      newStatus,
      targetTaskId,
      insertAbove,
      isReordering: draggedTask.status === newStatus
    });

    if (draggedTask.status === newStatus) {
      // We are moving within the same column.

      // Decide the effective target ID. Preference order:
      // 1. Explicit targetTaskId (we dropped on a task)
      // 2. lastTaskOverId remembered while hovering
      // 3. Fallback to first / last task in column based on drag direction

      let effectiveTargetId: number | null = targetTaskId ?? lastTaskOverId;

      if (effectiveTargetId == null) {
        const columnTasksSorted = Object.values(columns)
          .flat()
          .filter((t) => t.status === draggedTask.status && t.id !== sourceTaskId)
          .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

        if (columnTasksSorted.length > 0) {
          const movingDown = event.delta ? event.delta.y > 0 : false;
          effectiveTargetId = movingDown
            ? columnTasksSorted[columnTasksSorted.length - 1].id // last task
            : columnTasksSorted[0].id; // first task
        }
      }

      if (effectiveTargetId != null && effectiveTargetId !== sourceTaskId) {
        console.log('Reordering task', sourceTaskId, 'relative to task', effectiveTargetId);
        reorderTasks(sourceTaskId, effectiveTargetId);
      }
      return; // finished handling same-column move
    } else if (draggedTask.status !== newStatus) {
      // Moving to a different column (status change)
      console.log('Moving task', sourceTaskId, 'from', draggedTask.status, 'to', newStatus);
      
      const oldStatus = draggedTask.status;

      // Update store optimistically
      if (targetTaskId) {
        moveTaskToPosition(sourceTaskId, newStatus, targetTaskId, insertAbove);
      } else {
        updateTaskStatus(sourceTaskId, newStatus);
      }

      // Update via API
      updateTaskStatusMutation.mutate(
        { id: sourceTaskId, status: newStatus },
        {
          onError: () => {
            // Rollback on error
            updateTaskStatus(sourceTaskId, oldStatus);
          }
        }
      );
    }
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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-hidden">
          <div className={`grid gap-6 h-full p-2 ${
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
                isHighlighted={draggedOverColumn === status && activeTaskId !== null}
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