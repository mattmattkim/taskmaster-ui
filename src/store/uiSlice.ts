import { StateCreator } from 'zustand';
import { UIState, ViewMode, SortBy, SortOrder } from '@/types/ui';
import { TaskStatus } from '@/types/task';

export interface UISlice extends UIState {
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setCurrentView: (view: ViewMode) => void;
  setSelectedTaskId: (taskId: number | null) => void;
  setTaskDetailOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (statuses: string[]) => void;
  setFilterPriority: (priorities: string[]) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setIsDragging: (isDragging: boolean) => void;
  resetFilters: () => void;
  
  // Column visibility
  hiddenColumns: TaskStatus[];
  toggleColumnVisibility: (status: TaskStatus) => void;
  setHiddenColumns: (columns: TaskStatus[]) => void;
  
  // Task grouping
  groupByParentTask: boolean;
  setGroupByParentTask: (group: boolean) => void;
}

const initialUIState: UIState = {
  isSidebarOpen: true,
  currentView: 'kanban',
  selectedTaskId: null,
  isTaskDetailOpen: false,
  searchQuery: '',
  filterStatus: [],
  filterPriority: [],
  sortBy: 'id',
  sortOrder: 'asc',
  isDragging: false,
  hiddenColumns: [],
  groupByParentTask: false,
};

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set) => ({
  ...initialUIState,
  
  // Actions
  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),
  
  setSidebarOpen: (isOpen) => set({ 
    isSidebarOpen: isOpen 
  }),
  
  setCurrentView: (view) => set({ 
    currentView: view 
  }),
  
  setSelectedTaskId: (taskId) => set({ 
    selectedTaskId: taskId,
    isTaskDetailOpen: taskId !== null
  }),
  
  setTaskDetailOpen: (isOpen) => set((state) => ({ 
    isTaskDetailOpen: isOpen,
    selectedTaskId: isOpen ? state.selectedTaskId : null
  })),
  
  setSearchQuery: (query) => set({ 
    searchQuery: query 
  }),
  
  setFilterStatus: (statuses) => set({ 
    filterStatus: statuses 
  }),
  
  setFilterPriority: (priorities) => set({ 
    filterPriority: priorities 
  }),
  
  setSortBy: (sortBy) => set({ 
    sortBy 
  }),
  
  setSortOrder: (order) => set({ 
    sortOrder: order 
  }),
  
  setIsDragging: (isDragging) => set({ 
    isDragging 
  }),
  
  resetFilters: () => set({
    searchQuery: '',
    filterStatus: [],
    filterPriority: [],
    sortBy: 'id',
    sortOrder: 'asc',
  }),
  
  // Column visibility actions
  toggleColumnVisibility: (status) => set((state) => ({
    hiddenColumns: state.hiddenColumns.includes(status)
      ? state.hiddenColumns.filter(col => col !== status)
      : [...state.hiddenColumns, status]
  })),
  
  setHiddenColumns: (columns) => set({
    hiddenColumns: columns
  }),
  
  // Task grouping actions
  setGroupByParentTask: (group) => set({
    groupByParentTask: group
  }),
}); 