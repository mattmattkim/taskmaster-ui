'use client';

import { useTasksSSE } from '@/hooks/useTasksSSE';

interface TaskSyncProviderProps {
  children: React.ReactNode;
}

export function TaskSyncProvider({ children }: TaskSyncProviderProps) {
  // Establish SSE connection for real-time task updates
  useTasksSSE();
  
  return <>{children}</>;
} 