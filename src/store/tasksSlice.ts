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

export const createTasksSlice: StateCreator<
  TasksSlice,
  [],
  [],
  TasksSlice
> = (set, get) => ({
  // Initial state
  tasks: [],
  tasksLoading: false,
  tasksError: null,
  lastSync: null,
  
  // Actions
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id)
  })),
  
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, status } : task
    )
  })),
  
  updateSubtaskStatus: (taskId, subtaskId, status) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, status } : subtask
            )
          }
        : task
    )
  })),
  
  setTasksLoading: (loading) => set({ tasksLoading: loading }),
  setTasksError: (error) => set({ tasksError: error }),
  setLastSync: (date) => set({ lastSync: date }),
  
  // Selectors
  getTaskById: (id) => get().tasks.find((task) => task.id === id),
  
  getTasksByStatus: (status) =>
    get().tasks.filter((task) => task.status === status),
    
  getTasksByPriority: (priority) =>
    get().tasks.filter((task) => task.priority === priority),
    
  getPendingTasks: () =>
    get().tasks.filter((task) => task.status === 'pending'),
    
  getTasksWithSubtasks: () =>
    get().tasks.filter((task) => task.subtasks && task.subtasks.length > 0),
}); 