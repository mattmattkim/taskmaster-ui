'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;

  const disconnect = useCallback(() => {
    console.log('Disconnecting SSE');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE connection already exists or is connecting, skipping');
      return;
    }

    // Stop if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, stopping reconnections');
      setTasksError('Connection failed after multiple attempts. Please refresh the page.');
      return;
    }

    try {
      isConnectingRef.current = true;

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
        isConnectingRef.current = false;
        setTasksError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

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

                // Update React Query cache for all task list queries
                queryClient.setQueriesData({ queryKey: taskKeys.lists() }, data.tasks as Task[]);

                // Invalidate queries to ensure consistency
                queryClient.invalidateQueries({
                  queryKey: taskKeys.lists(),
                  refetchType: 'none', // Don't refetch immediately, just mark as stale
                });
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

      eventSource.onerror = (_error) => {
        console.error('SSE connection error occurred');
        console.error('EventSource readyState:', eventSource.readyState);
        console.error('Connection state:', {
          CONNECTING: EventSource.CONNECTING,
          OPEN: EventSource.OPEN,
          CLOSED: EventSource.CLOSED,
          current: eventSource.readyState,
        });

        isConnectingRef.current = false;

        // Only attempt reconnection if we're not at max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current++;

          setTasksError(
            `Connection lost. Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`);
            connect();
          }, delay);
        } else {
          setTasksError('Connection failed after multiple attempts. Please refresh the page.');
        }

        // Close the failed connection
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
      isConnectingRef.current = false;
      setTasksError('Failed to connect to task watcher');
    }
  }, [setTasks, setLastSync, setTasksError, queryClient]);

  useEffect(() => {
    console.log('useTasksSSE: Mounting, establishing connection');

    // Connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      console.log('useTasksSSE: Unmounting, cleaning up');
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    reconnect: connect,
    disconnect,
  };
};
