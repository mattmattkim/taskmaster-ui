'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from './useTaskStore';
import { Task } from '@/types/task';
import { taskKeys } from './useTasksQuery';

export const useTasksSSE = () => {
  const { setTasks, setLastSync, setTasksError } = useTasks();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const connect = () => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        console.log('Closing existing SSE connection');
        eventSourceRef.current.close();
      }
      
      // Create new EventSource connection
      console.log('Creating new SSE connection to /api/tasks-watch');
      const eventSource = new EventSource('/api/tasks-watch');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection established successfully');
        reconnectAttemptsRef.current = 0;
        setTasksError(null);
      };
      
      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data.type, data);
          
          switch (data.type) {
            case 'connected':
              console.log('Connected to task watcher');
              break;
              
            case 'initial-tasks':
            case 'tasks-updated':
              if (data.tasks && Array.isArray(data.tasks)) {
                console.log(`Processing ${data.type} with ${data.tasks.length} tasks`);
                
                // Update Zustand store
                setTasks(data.tasks as Task[]);
                setLastSync(new Date());
                console.log('Updated Zustand store with new tasks');
                
                // Update React Query cache for all task list queries
                const updatedQueries = queryClient.setQueriesData(
                  { queryKey: taskKeys.lists() },
                  data.tasks as Task[]
                );
                console.log('Updated React Query caches:', updatedQueries.length, 'queries');
                
                // Log the actual query keys that were updated
                updatedQueries.forEach(([queryKey]) => {
                  console.log('Updated query:', queryKey);
                });
                
                // Invalidate queries to ensure consistency
                // This will trigger a refetch if any components are actively using the data
                queryClient.invalidateQueries({ 
                  queryKey: taskKeys.lists(),
                  refetchType: 'none' // Don't refetch immediately, just mark as stale
                });
                console.log('Invalidated React Query task lists');
              } else {
                console.warn('Received tasks update without valid tasks array:', data);
              }
              break;
              
            default:
              console.log('Unknown SSE message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          console.error('Raw event data:', event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE error occurred:', error);
        console.log('EventSource readyState:', eventSource.readyState);
        console.log('EventSource.CONNECTING:', EventSource.CONNECTING);
        console.log('EventSource.OPEN:', EventSource.OPEN);
        console.log('EventSource.CLOSED:', EventSource.CLOSED);
        
        eventSource.close();
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        setTasksError('Connection lost. Reconnecting...');
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
      setTasksError('Failed to connect to task watcher');
    }
  };
  
  const disconnect = () => {
    console.log('Disconnecting SSE');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    console.log('useTasksSSE: Mounting, establishing connection');
    // Connect on mount
    connect();
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, disconnecting SSE');
        disconnect();
      } else {
        console.log('Page visible, reconnecting SSE');
        connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      console.log('useTasksSSE: Unmounting, cleaning up');
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    reconnect: connect,
    disconnect,
  };
}; 