'use client';

import { useEffect, useRef } from 'react';
import { useTasks } from './useTaskStore';
import { Task } from '@/types/task';

export const useTasksSSE = () => {
  const { setTasks, setLastSync, setTasksError } = useTasks();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const connect = () => {
    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create new EventSource connection
      const eventSource = new EventSource('/api/tasks-watch');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
        reconnectAttemptsRef.current = 0;
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
                setTasks(data.tasks as Task[]);
                setLastSync(new Date());
                console.log('Tasks updated:', data.tasks.length, 'tasks');
              }
              break;
              
            default:
              console.log('Unknown SSE message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
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
    // Connect on mount
    connect();
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect();
      } else {
        connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    reconnect: connect,
    disconnect,
  };
}; 