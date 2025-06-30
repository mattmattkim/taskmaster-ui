import * as fs from 'fs/promises';
import * as path from 'path';
import { Task } from '@/types/task';

const TASKS_FILE_PATH = path.join(process.cwd(), '.taskmaster', 'tasks', 'tasks.json');

export interface TasksFileData {
  tasks: Task[];
  metadata?: {
    version?: string;
    lastModified?: string;
    currentTag?: string;
    [key: string]: any;
  };
}

/**
 * Reads the tasks.json file and returns the parsed data
 * Handles both flat format { tasks: [...] } and Taskmaster tagged format { "master": { "tasks": [...] } }
 */
export async function readTasksFile(tag: string = 'master'): Promise<TasksFileData> {
  try {
    const fileContent = await fs.readFile(TASKS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Check if this is a Taskmaster tagged format
    if (data[tag] && Array.isArray(data[tag].tasks)) {
      return { 
        tasks: data[tag].tasks,
        metadata: {
          currentTag: tag,
          ...data[tag].metadata
        }
      };
    }
    
    // Check if this is a flat format
    if (Array.isArray(data.tasks)) {
      return data;
    }
    
    // If neither format matches, return empty
    return { tasks: [] };
  } catch (error) {
    // If file doesn't exist or is invalid, return empty tasks
    console.error('Error reading tasks file:', error);
    return { tasks: [] };
  }
}

/**
 * Writes data to the tasks.json file
 * Maintains the Taskmaster tagged format if it exists
 */
export async function writeTasksFile(data: TasksFileData, tag: string = 'master'): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(TASKS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    let fileData: any;
    
    // Try to read existing file to maintain structure
    try {
      const existingContent = await fs.readFile(TASKS_FILE_PATH, 'utf-8');
      fileData = JSON.parse(existingContent);
    } catch {
      // If file doesn't exist or is invalid, create new structure
      fileData = {};
    }
    
    // Check if this is a Taskmaster tagged format
    if (fileData[tag] || Object.keys(fileData).some(key => typeof fileData[key] === 'object' && fileData[key].tasks)) {
      // Maintain tagged format
      if (!fileData[tag]) {
        fileData[tag] = {};
      }
      
      fileData[tag].tasks = data.tasks;
      fileData[tag].metadata = {
        ...fileData[tag].metadata,
        lastModified: new Date().toISOString(),
        version: '1.0.0',
      };
    } else {
      // Use flat format
      fileData = {
        ...data,
        metadata: {
          ...data.metadata,
          lastModified: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    }
    
    // Write file with pretty formatting
    await fs.writeFile(
      TASKS_FILE_PATH,
      JSON.stringify(fileData, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error writing tasks file:', error);
    throw new Error('Failed to save tasks');
  }
}

/**
 * Gets a single task by ID
 */
export async function getTaskById(id: number, tag: string = 'master'): Promise<Task | null> {
  const { tasks } = await readTasksFile(tag);
  return tasks.find(task => task.id === id) || null;
}

/**
 * Updates a single task
 */
export async function updateTask(id: number, updates: Partial<Task>, tag: string = 'master'): Promise<Task | null> {
  const data = await readTasksFile(tag);
  const taskIndex = data.tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    return null;
  }
  
  // Update the task
  data.tasks[taskIndex] = {
    ...data.tasks[taskIndex],
    ...updates,
    id, // Ensure ID doesn't change
  };
  
  await writeTasksFile(data, tag);
  return data.tasks[taskIndex];
}

/**
 * Creates a new task
 */
export async function createTask(taskData: Omit<Task, 'id'>, tag: string = 'master'): Promise<Task> {
  const data = await readTasksFile(tag);
  
  // Find the highest ID and increment
  const maxId = data.tasks.reduce((max, task) => Math.max(max, task.id), 0);
  const newTask: Task = {
    ...taskData,
    id: maxId + 1,
  };
  
  data.tasks.push(newTask);
  await writeTasksFile(data, tag);
  
  return newTask;
}

/**
 * Deletes a task by ID
 */
export async function deleteTask(id: number, tag: string = 'master'): Promise<boolean> {
  const data = await readTasksFile(tag);
  const initialLength = data.tasks.length;
  
  data.tasks = data.tasks.filter(task => task.id !== id);
  
  if (data.tasks.length === initialLength) {
    return false; // Task not found
  }
  
  await writeTasksFile(data, tag);
  return true;
}

/**
 * Validates that the tasks file exists and is readable
 */
export async function validateTasksFile(): Promise<boolean> {
  try {
    await fs.access(TASKS_FILE_PATH, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
} 