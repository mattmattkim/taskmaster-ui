import { z } from 'zod';

// Enums
export const TaskStatusSchema = z.enum([
  'pending',
  'in-progress',
  'done',
  'review',
  'blocked',
  'deferred',
  'cancelled',
]);

export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

// Subtask schema
export const SubtaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  dependencies: z.array(z.number().int()),
  details: z.string(),
  status: TaskStatusSchema,
  testStrategy: z.string().optional(),
});

// Main task schema
export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  details: z.string(),
  testStrategy: z.string(),
  priority: TaskPrioritySchema,
  dependencies: z.array(z.number().int()),
  status: TaskStatusSchema,
  subtasks: z.array(SubtaskSchema),
});

// Schema for creating a new task (without ID)
export const CreateTaskSchema = TaskSchema.omit({ id: true });

// Schema for updating a task (all fields optional, ID not required since it comes from URL)
export const UpdateTaskSchema = TaskSchema.partial().omit({ id: true });

// Schema for task query parameters
export const TaskQuerySchema = z.object({
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  search: z.string().optional(),
});

// Type exports
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
// For internal API calls that need to include the ID
export type UpdateTaskWithIdInput = {
  id: number;
  title?: string;
  description?: string;
  details?: string;
  testStrategy?: string;
  priority?: TaskPriority;
  dependencies?: number[];
  status?: TaskStatus;
  subtasks?: Subtask[];
};
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
