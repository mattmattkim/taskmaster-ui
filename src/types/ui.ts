// UI state types
import { TaskStatus } from './task';

export type ViewMode = 'kanban' | 'list' | 'timeline';
export type SortBy = 'id' | 'title' | 'priority' | 'status' | 'dependencies';
export type SortOrder = 'asc' | 'desc';

export interface UIState {
  isSidebarOpen: boolean;
  currentView: ViewMode;
  selectedTaskId: number | null;
  isTaskDetailOpen: boolean;
  searchQuery: string;
  filterStatus: string[];
  filterPriority: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  isDragging: boolean;
  hiddenColumns: TaskStatus[];
  groupByParentTask: boolean;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showSubtasks: boolean;
  compactView: boolean;
  showDependencies: boolean;
  animationsEnabled: boolean;
} 