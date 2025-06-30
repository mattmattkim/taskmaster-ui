import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

// Store active connections
const clients = new Set<ReadableStreamDefaultController>();

// Path to tasks.json file
const TASKS_FILE_PATH = path.join(process.cwd(), '.taskmaster', 'tasks', 'tasks.json');

// Initialize file watcher
let watcher: chokidar.FSWatcher | null = null;

function initializeWatcher() {
  if (watcher) return;
  
  watcher = chokidar.watch(TASKS_FILE_PATH, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });
  
  watcher.on('change', () => {
    console.log('tasks.json changed, notifying clients...');
    broadcastUpdate();
  });
  
  watcher.on('error', (error) => {
    console.error('File watcher error:', error);
  });
}

function broadcastUpdate() {
  try {
    // Read the updated tasks file
    const tasksData = fs.readFileSync(TASKS_FILE_PATH, 'utf-8');
    const tasks = JSON.parse(tasksData);
    
    // Send update to all connected clients
    const message = `data: ${JSON.stringify({ type: 'tasks-updated', tasks })}\n\n`;
    
    clients.forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        // Client might be disconnected
        clients.delete(controller);
      }
    });
  } catch (error) {
    console.error('Error broadcasting update:', error);
  }
}

export async function GET(request: NextRequest) {
  // Initialize watcher if not already done
  initializeWatcher();
  
  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);
      
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );
      
      // Send initial tasks data
      try {
        if (fs.existsSync(TASKS_FILE_PATH)) {
          const tasksData = fs.readFileSync(TASKS_FILE_PATH, 'utf-8');
          const tasks = JSON.parse(tasksData);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'initial-tasks', tasks })}\n\n`)
          );
        }
      } catch (error) {
        console.error('Error reading initial tasks:', error);
      }
      
      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:ping\n\n`));
        } catch (error) {
          clearInterval(pingInterval);
          clients.delete(controller);
        }
      }, 30000); // Ping every 30 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        clients.delete(controller);
      });
    },
    
    cancel(controller) {
      // Client disconnected
      clients.delete(controller);
    }
  });
  
  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 