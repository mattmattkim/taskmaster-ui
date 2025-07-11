import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { CreateTaskInput, UpdateTaskWithIdInput } from '@/lib/validations/task';

// API client functions
const taskApi = {
  // Get all tasks
  getTasks: async (filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
  }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const response = await fetch(`/api/tasks?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data = await response.json();
    return data.tasks;
  },

  // Get a single task
  getTask: async (id: number): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    const data = await response.json();
    return data.task;
  },

  // Create a task
  createTask: async (task: CreateTaskInput): Promise<Task> => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const data = await response.json();
    return data.task;
  },

  // Update a task
  updateTask: async ({ id, ...updates }: UpdateTaskWithIdInput): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    const data = await response.json();
    return data.task;
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },
};

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: { status?: TaskStatus; priority?: TaskPriority; search?: string }) =>
    [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

// Hooks

// Get all tasks
export const useTasksQuery = (filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}) => {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.getTasks(filters),
  });
};

// Get a single task
export const useTaskQuery = (id: number) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskApi.getTask(id),
    enabled: id > 0,
  });
};

// Create a task
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

// Update a task
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.updateTask,
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

// Delete a task
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

// Update task status (convenience hook)
export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      taskApi.updateTask({ id, status }),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous tasks for potential rollback
      const previousTasksData = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update ALL query caches that match our pattern
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: Task[] | undefined) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((task) => (task.id === id ? { ...task, status } : task));
      });

      return { previousTasksData };
    },
    onError: (err, variables, context) => {
      // Rollback all caches on error
      if (context?.previousTasksData) {
        context.previousTasksData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error('Failed to update task status:', err);
    },
    onSettled: () => {
      // Only invalidate after success/error handling is complete
      // This prevents the data from being refetched immediately
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      }, 100);
    },
  });
};
