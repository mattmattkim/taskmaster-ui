import { NextRequest, NextResponse } from 'next/server';
import { readTasksFile, createTask, writeTasksFile } from '@/lib/tasks-file';
import { TaskQuerySchema, CreateTaskSchema } from '@/lib/validations/task';
import { z } from 'zod';

// GET /api/tasks - Get all tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Get tag from query params (defaults to 'master')
    const tag = searchParams.get('tag') || 'master';

    console.log('API: Getting tasks with tag:', tag);
    console.log('API: Query params:', query);

    // Validate query parameters
    const validatedQuery = TaskQuerySchema.parse(query);

    // Read tasks from file
    const { tasks } = await readTasksFile(tag);
    console.log('API: Read tasks count:', tasks.length);

    // Apply filters
    let filteredTasks = tasks;

    if (validatedQuery.status) {
      filteredTasks = filteredTasks.filter((task) => task.status === validatedQuery.status);
      console.log('API: After status filter:', filteredTasks.length);
    }

    if (validatedQuery.priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === validatedQuery.priority);
      console.log('API: After priority filter:', filteredTasks.length);
    }

    if (validatedQuery.search) {
      const searchLower = validatedQuery.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.details.toLowerCase().includes(searchLower)
      );
      console.log('API: After search filter:', filteredTasks.length);
    }

    console.log('API: Returning tasks count:', filteredTasks.length);
    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('API: Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateTaskSchema.parse(body);

    // Get tag from query params (defaults to 'master')
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag') || 'master';

    // Create the task
    const newTask = await createTask(validatedData, tag);

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid task data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
