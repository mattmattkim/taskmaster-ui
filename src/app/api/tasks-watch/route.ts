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

    clients.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(message));
      } catch (error) {
        // Client might be disconnected
        console.log('Failed to send to client, marking for removal');
        failedClients.add(controller);
      }
    });

    // Clean up failed clients
    failedClients.forEach((controller) => clients.delete(controller));

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

      // Add this client to the set
      clients.add(controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Send initial tasks data
      try {
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
        console.error('Error reading initial tasks:', error);
      }

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:ping\n\n`));
        } catch (error) {
          clearInterval(pingInterval);
          clients.delete(controller);
          console.log('Client disconnected during ping');
        }
      }, 30000); // Ping every 30 seconds

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        clients.delete(controller);
        console.log('Client disconnected (abort signal)');
      });
    },

    cancel(controller) {
      // Client disconnected
      clients.delete(controller);
      console.log('Client disconnected (cancel)');
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
