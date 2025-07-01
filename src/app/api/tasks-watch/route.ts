import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

// Store active connections with their cleanup functions
const clients = new Map<ReadableStreamDefaultController, () => void>();

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
      pollInterval: 100,
    },
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
    const tasksJson = JSON.parse(tasksData);

    // Extract tasks array from the current tag (master)
    const tasks = tasksJson.master?.tasks || [];

    // Send update to all connected clients
    const message = `data: ${JSON.stringify({ type: 'tasks-updated', tasks })}\n\n`;
    const encoder = new TextEncoder();

    // Track failed clients for cleanup
    const failedClients = new Set<ReadableStreamDefaultController>();

    clients.forEach((cleanup, controller) => {
      try {
        controller.enqueue(encoder.encode(message));
      } catch (error) {
        // Client might be disconnected, mark for cleanup
        console.log('Failed to send to client, marking for removal');
        failedClients.add(controller);
      }
    });

    // Clean up failed clients
    failedClients.forEach((controller) => {
      const cleanup = clients.get(controller);
      if (cleanup) cleanup();
      clients.delete(controller);
    });

    console.log(`Broadcast complete. Active clients: ${clients.size}`);
  } catch (error) {
    console.error('Error broadcasting update:', error);
  }
}

export async function GET(request: NextRequest) {
  console.log('SSE connection request received');

  // Initialize watcher if not already done
  initializeWatcher();

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('New SSE client connected');
      
      const encoder = new TextEncoder();
      
      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          // Check if controller is still valid before pinging
          if (clients.has(controller)) {
            controller.enqueue(encoder.encode(`:ping\n\n`));
          } else {
            clearInterval(pingInterval);
          }
        } catch (error) {
          console.log('Error sending ping, cleaning up client');
          clearInterval(pingInterval);
          clients.delete(controller);
        }
      }, 30000); // Ping every 30 seconds

      // Cleanup function for this connection
      const cleanup = () => {
        clearInterval(pingInterval);
        clients.delete(controller);
      };

      // Add this client to the map with its cleanup function
      clients.set(controller, cleanup);

      // Send initial connection message
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        // Send initial tasks data
        if (fs.existsSync(TASKS_FILE_PATH)) {
          const tasksData = fs.readFileSync(TASKS_FILE_PATH, 'utf-8');
          const tasksJson = JSON.parse(tasksData);
          // Extract tasks array from the current tag (master)
          const tasks = tasksJson.master?.tasks || [];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'initial-tasks', tasks })}\n\n`)
          );
        }
      } catch (error) {
        console.error('Error sending initial data:', error);
        cleanup();
      }

      // Clean up on client abort
      request.signal.addEventListener('abort', () => {
        console.log('Client disconnected (abort signal)');
        cleanup();
      });
    },

    cancel(reason) {
      // Client disconnected
      console.log('Client disconnected (cancel)', reason);
      const cleanup = clients.get(reason);
      if (cleanup) cleanup();
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
