'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { useTaskDetail } from '@/hooks/useUIStore';
import { useTasks } from '@/hooks/useTaskStore';
import { useUpdateTaskMutation } from '@/hooks/useTasksQuery';
import { X, Edit2, Save, AlertCircle, CheckCircle2, Clock, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

// Validation schema for task form
const TaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long'),
  details: z.string().max(5000, 'Details are too long'),
  testStrategy: z.string().max(2000, 'Test strategy is too long'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in-progress', 'done', 'review', 'blocked', 'deferred', 'cancelled']),
  dependencies: z.array(z.number()),
});

const STATUS_OPTIONS: TaskStatus[] = [
  'pending',
  'in-progress',
  'done',
  'review',
  'blocked',
  'deferred',
  'cancelled',
];

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  deferred: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400',
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

export function TaskDetail() {
  const { selectedTaskId, setTaskDetailOpen } = useTaskDetail();
  const { tasks } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateTaskMutation = useUpdateTaskMutation();

  const task = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        details: task.details,
        testStrategy: task.testStrategy,
        priority: task.priority,
        status: task.status,
        dependencies: [...task.dependencies],
      });
    }
  }, [task]);

  if (!task) return null;

  const handleClose = () => {
    setTaskDetailOpen(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!task) return;

    // Validate form data
    try {
      const validatedData = TaskFormSchema.parse(formData);
      setValidationErrors({});

      // Call API to update task
      await updateTaskMutation.mutateAsync({
        id: task.id,
        ...validatedData,
      });

      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set validation errors
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
      } else {
        // Handle API errors
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      title: task.title,
      description: task.description,
      details: task.details,
      testStrategy: task.testStrategy,
      priority: task.priority,
      status: task.status,
      dependencies: [...task.dependencies],
    });
    setValidationErrors({});
    setIsEditing(false);
  };

  const completedSubtasks = task.subtasks?.filter((st) => st.status === 'done').length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Screen reader announcement for keyboard shortcuts */}
      <div className="sr-only" role="status" aria-live="polite">
        Press Escape to close. Use Tab to navigate between fields.
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 id="task-detail-title" className="text-xl font-semibold">Task Details</h2>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={updateTaskMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" className="gap-2" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </>
          )}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close task details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {updateTaskMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">Failed to update task. Please try again.</p>
            </div>
          )}

          {/* Success Message */}
          {updateTaskMutation.isSuccess && !isEditing && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-sm">Task updated successfully!</p>
            </div>
          )}
          {/* Task ID and Priority */}
          <div id="task-detail-description" className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-mono">#{task.id}</span>
            {isEditing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="px-3 py-1 text-sm rounded-full border dark:bg-gray-800"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            {isEditing ? (
              <div>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    // Clear error when user starts typing
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: '' });
                    }
                  }}
                  className={`mt-1 ${validationErrors.title ? 'border-red-500' : ''}`}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.title}</p>
                )}
              </div>
            ) : (
              <h3 className="text-lg font-semibold mt-1">{task.title}</h3>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="mt-1 w-full px-3 py-2 rounded-md border dark:bg-gray-800"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1">
                <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>
                  {task.status}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-md border dark:bg-gray-800 min-h-[80px]"
              />
            ) : (
              <p className="mt-1 text-sm">{task.description || 'No description'}</p>
            )}
          </div>

          {/* Details */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Implementation Details</label>
            {isEditing ? (
              <textarea
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-md border dark:bg-gray-800 min-h-[120px]"
              />
            ) : (
              <div className="mt-1 text-sm whitespace-pre-wrap">{task.details || 'No details'}</div>
            )}
          </div>

          {/* Test Strategy */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Test Strategy</label>
            {isEditing ? (
              <textarea
                value={formData.testStrategy}
                onChange={(e) => setFormData({ ...formData, testStrategy: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-md border dark:bg-gray-800 min-h-[80px]"
              />
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap">{task.testStrategy || 'No test strategy'}</p>
            )}
          </div>

          {/* Dependencies */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Dependencies ({task.dependencies.length})
            </label>
            {task.dependencies.length > 0 ? (
              <div className="mt-2 space-y-1">
                {task.dependencies.map((depId) => {
                  const depTask = tasks.find((t) => t.id === depId);
                  return (
                    <div key={depId} className="flex items-center gap-2 text-sm">
                      {depTask?.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="font-mono">#{depId}</span>
                      {depTask && <span className="text-muted-foreground">{depTask.title}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No dependencies</p>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Subtasks ({completedSubtasks}/{totalSubtasks})
              {totalSubtasks > 0 && completedSubtasks === totalSubtasks && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </label>
            {task.subtasks.length > 0 ? (
              <div className="mt-2 space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              subtask.status === 'done'
                                ? 'bg-green-500'
                                : subtask.status === 'in-progress'
                                  ? 'bg-blue-500'
                                  : subtask.status === 'blocked'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                            }`}
                          />
                          <span className="font-medium text-sm">{subtask.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            #{task.id}.{subtask.id}
                          </span>
                        </div>
                        {subtask.description && (
                          <p className="text-sm text-muted-foreground mt-1">{subtask.description}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[subtask.status]}`}>
                        {subtask.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No subtasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 