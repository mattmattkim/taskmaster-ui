'use client';

import { KanbanControls } from './KanbanControls';
import { KanbanColumn } from './KanbanColumn';
import { useUI } from '@/hooks/useUIStore';
import { useStore } from '@/store';
import { Task, TaskStatus } from '@/types/task';
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
import { useState, useMemo } from 'react';
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
  const { updateTaskStatus, reorderTasks, moveTaskToPosition } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
  
  // Get filter and sort settings from store
  const searchQuery = useStore((state) => state.searchQuery);
  const filterStatus = useStore((state) => state.filterStatus);
  const filterPriority = useStore((state) => state.filterPriority);
  const sortBy = useStore((state) => state.sortBy);
  const sortOrder = useStore((state) => state.sortOrder);
  const groupByParentTask = useStore((state) => state.groupByParentTask);
  
  // Fetch tasks using React Query
  const { data: tasks = [], isLoading, error } = useTasksQuery();
  const updateTaskStatusMutation = useUpdateTaskStatusMutation();

  // Process tasks into columns using React Query data
  const columns = useMemo(() => {
    const statusColumns: Record<TaskStatus, Task[]> = {
      'pending': [],
      'in-progress': [],
      'review': [],
      'done': [],
      'blocked': [],
      'deferred': [],
      'cancelled': [],
    };
    
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task: Task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.details.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus.length > 0) {
      filtered = filtered.filter((task: Task) =>
        filterStatus.includes(task.status)
      );
    }
    
    // Apply priority filter
    if (filterPriority.length > 0) {
      filtered = filtered.filter((task: Task) =>
        filterPriority.includes(task.priority)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a: Task, b: Task) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'id':
          compareValue = a.id - b.id;
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        case 'dependencies':
          compareValue = a.dependencies.length - b.dependencies.length;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    // Distribute tasks into columns
    if (groupByParentTask) {
      // Group subtasks under their parent tasks
      const parentTasks = sorted.filter((task: Task) => task.subtasks && task.subtasks.length > 0);
      const standaloneSubtasks = sorted.filter((task: Task) => !task.subtasks || task.subtasks.length === 0);
      
      // Add parent tasks to their respective columns
      parentTasks.forEach((task: Task) => {
        if (statusColumns[task.status]) {
          statusColumns[task.status].push(task);
        }
      });
      
      // Add standalone tasks (no subtasks) to their respective columns
      standaloneSubtasks.forEach((task: Task) => {
        if (statusColumns[task.status]) {
          statusColumns[task.status].push(task);
        }
      });
    } else {
      // Normal flat view
      sorted.forEach((task: Task) => {
        if (statusColumns[task.status]) {
          statusColumns[task.status].push(task);
        }
      });
    }
    
    // Sort each column by order field when sorting by ID (for manual reordering)
    if (sortBy === 'id') {
      Object.keys(statusColumns).forEach((status) => {
        statusColumns[status as TaskStatus].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
      });
    }
    
    return statusColumns;
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy, sortOrder, groupByParentTask]);

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
      // Dropped on a column (goes to end)
      newStatus = over.id as TaskStatus;
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

    if (draggedTask.status === newStatus && targetTaskId) {
      // Reordering within the same column
      console.log('Reordering task', sourceTaskId, insertAbove ? 'above' : 'below', 'task', targetTaskId);
      reorderTasks(sourceTaskId, targetTaskId);
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