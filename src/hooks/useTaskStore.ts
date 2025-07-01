import { useStore } from '@/store';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { useMemo } from 'react';

// Hook for tasks state and actions
export const useTasks = () => {
  const tasks = useStore((state) => state.tasks);
  const tasksLoading = useStore((state) => state.tasksLoading);
  const tasksError = useStore((state) => state.tasksError);
  const lastSync = useStore((state) => state.lastSync);

  const setTasks = useStore((state) => state.setTasks);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const updateSubtaskStatus = useStore((state) => state.updateSubtaskStatus);
  const reorderTasks = useStore((state) => state.reorderTasks);
  const moveTaskToPosition = useStore((state) => state.moveTaskToPosition);
  const setTasksLoading = useStore((state) => state.setTasksLoading);
  const setTasksError = useStore((state) => state.setTasksError);
  const setLastSync = useStore((state) => state.setLastSync);

  return {
    tasks,
    tasksLoading,
    tasksError,
    lastSync,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateSubtaskStatus,
    reorderTasks,
    moveTaskToPosition,
    setTasksLoading,
    setTasksError,
    setLastSync,
  };
};

// Hook for task selectors
export const useTaskSelectors = () => {
  const getTaskById = useStore((state) => state.getTaskById);
  const getTasksByStatus = useStore((state) => state.getTasksByStatus);
  const getTasksByPriority = useStore((state) => state.getTasksByPriority);
  const getPendingTasks = useStore((state) => state.getPendingTasks);
  const getTasksWithSubtasks = useStore((state) => state.getTasksWithSubtasks);

  return {
    getTaskById,
    getTasksByStatus,
    getTasksByPriority,
    getPendingTasks,
    getTasksWithSubtasks,
  };
};

// Hook for filtered and sorted tasks
export const useFilteredTasks = () => {
  const tasks = useStore((state) => state.tasks);
  const searchQuery = useStore((state) => state.searchQuery);
  const filterStatus = useStore((state) => state.filterStatus);
  const filterPriority = useStore((state) => state.filterPriority);
  const sortBy = useStore((state) => state.sortBy);
  const sortOrder = useStore((state) => state.sortOrder);

  const filteredTasks = useMemo(() => {
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
      filtered = filtered.filter((task: Task) => filterStatus.includes(task.status));
    }

    // Apply priority filter
    if (filterPriority.length > 0) {
      filtered = filtered.filter((task: Task) => filterPriority.includes(task.priority));
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
          const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
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

    return sorted;
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy, sortOrder]);

  return filteredTasks;
};

// Hook for kanban board columns
export const useKanbanColumns = () => {
  const tasks = useFilteredTasks();
  const groupByParentTask = useStore((state) => state.groupByParentTask);
  const sortBy = useStore((state) => state.sortBy);

  const columns = useMemo(() => {
    const statusColumns: Record<TaskStatus, Task[]> = {
      pending: [],
      'in-progress': [],
      review: [],
      done: [],
      blocked: [],
      deferred: [],
      cancelled: [],
    };

    if (groupByParentTask) {
      // Group subtasks under their parent tasks
      const parentTasks = tasks.filter((task: Task) => task.subtasks && task.subtasks.length > 0);
      const standaloneSubtasks = tasks.filter(
        (task: Task) => !task.subtasks || task.subtasks.length === 0
      );

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
      tasks.forEach((task: Task) => {
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
  }, [tasks, groupByParentTask, sortBy]);

  return columns;
};
