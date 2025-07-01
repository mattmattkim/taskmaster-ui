import { StateCreator } from 'zustand';
import { Task, TasksData, TaskStatus, TaskPriority } from '@/types/task';

export interface TasksSlice {
  // State
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  lastSync: Date | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  updateTaskStatus: (id: number, status: TaskStatus) => void;
  updateSubtaskStatus: (taskId: number, subtaskId: number, status: TaskStatus) => void;
  reorderTasks: (sourceId: number, targetId: number) => void;
  moveTaskToPosition: (
    sourceId: number,
    newStatus: TaskStatus,
    targetId?: number,
    insertAbove?: boolean
  ) => void;
  setTasksLoading: (loading: boolean) => void;
  setTasksError: (error: string | null) => void;
  setLastSync: (date: Date) => void;

  // Selectors
  getTaskById: (id: number) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getPendingTasks: () => Task[];
  getTasksWithSubtasks: () => Task[];
}

export const createTasksSlice: StateCreator<TasksSlice, [], [], TasksSlice> = (set, get) => ({
  // Initial state
  tasks: [],
  tasksLoading: false,
  tasksError: null,
  lastSync: null,

  // Actions
  setTasks: (tasks) =>
    set({
      tasks: tasks.map((task, index) => ({
        ...task,
        order: task.order ?? index, // Initialize order if not present
      })),
    }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status } : task)),
    })),

  updateSubtaskStatus: (taskId, subtaskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, status } : subtask
              ),
            }
          : task
      ),
    })),

  reorderTasks: (sourceId, targetId) =>
    set((state) => {
      const sourceTask = state.tasks.find((task) => task.id === sourceId);
      const targetTask = state.tasks.find((task) => task.id === targetId);

      if (!sourceTask || !targetTask || sourceTask.status !== targetTask.status) {
        return { tasks: state.tasks };
      }

      // Get all tasks in the same column, sorted by order (ensure order is initialized)
      const columnTasks = state.tasks
        .filter((task) => task.status === sourceTask.status)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

      // Find positions
      const sourceIndex = columnTasks.findIndex((task) => task.id === sourceId);
      const targetIndex = columnTasks.findIndex((task) => task.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        return { tasks: state.tasks };
      }

      // Remove the source task
      const reordered = [...columnTasks];
      const [movedTask] = reordered.splice(sourceIndex, 1);

      // After removal, compute where the target task is now
      const newTargetIndex = reordered.findIndex((task) => task.id === targetId);
      const movingDown = sourceIndex < targetIndex;
      const insertPosition = movingDown ? newTargetIndex + 1 : newTargetIndex;

      reordered.splice(insertPosition, 0, movedTask);

      // Update order fields consistently
      const updatedTasks = state.tasks.map((task) => {
        if (task.status === sourceTask.status) {
          const newIndex = reordered.findIndex((t) => t.id === task.id);
          return { ...task, order: newIndex };
        }
        return task;
      });

      return { tasks: updatedTasks };
    }),

  moveTaskToPosition: (sourceId, newStatus, targetId, insertAbove = true) =>
    set((state) => {
      const sourceTask = state.tasks.find((task) => task.id === sourceId);
      if (!sourceTask) return { tasks: state.tasks };

      // Get tasks in the target column (excluding the source task), sorted by order
      const targetColumnTasks = state.tasks
        .filter((task) => task.status === newStatus && task.id !== sourceId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      let insertIndex = targetColumnTasks.length; // Default to end

      if (targetId) {
        const targetTask = targetColumnTasks.find((task) => task.id === targetId);
        if (targetTask) {
          insertIndex = targetColumnTasks.findIndex((task) => task.id === targetId);
          if (insertIndex === -1) insertIndex = targetColumnTasks.length;

          // If insertAbove is false, insert after the target task
          if (!insertAbove) {
            insertIndex += 1;
          }
        }
      }

      // Create the new array with the task inserted at the correct position
      const newColumnTasks = [...targetColumnTasks];
      newColumnTasks.splice(insertIndex, 0, { ...sourceTask, status: newStatus });

      // Update all tasks
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === sourceId) {
          // Update the moved task
          return { ...task, status: newStatus, order: insertIndex };
        } else if (task.status === newStatus) {
          // Update order of existing tasks in target column
          const newIndex = newColumnTasks.findIndex((t) => t.id === task.id);
          return { ...task, order: newIndex };
        }
        return task;
      });

      return { tasks: updatedTasks };
    }),

  setTasksLoading: (loading) => set({ tasksLoading: loading }),
  setTasksError: (error) => set({ tasksError: error }),
  setLastSync: (date) => set({ lastSync: date }),

  // Selectors
  getTaskById: (id) => get().tasks.find((task) => task.id === id),

  getTasksByStatus: (status) => get().tasks.filter((task) => task.status === status),

  getTasksByPriority: (priority) => get().tasks.filter((task) => task.priority === priority),

  getPendingTasks: () => get().tasks.filter((task) => task.status === 'pending'),

  getTasksWithSubtasks: () =>
    get().tasks.filter((task) => task.subtasks && task.subtasks.length > 0),
});
