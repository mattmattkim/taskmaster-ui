// Task-related types matching Task Master's data structure

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'review' | 'blocked' | 'deferred' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: number;
  title: string;
  description: string;
  dependencies: number[];
  details: string;
  status: TaskStatus;
  testStrategy?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  priority: TaskPriority;
  dependencies: number[];
  status: TaskStatus;
  subtasks: Subtask[];
}

export interface TasksData {
  tasks: Task[];
  metadata?: {
    version: string;
    lastModified: string;
    [key: string]: any;
  };
} 