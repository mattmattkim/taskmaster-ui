import { useStore } from '@/store';

// Hook for UI state and actions
export const useUI = () => {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const currentView = useStore((state) => state.currentView);
  const selectedTaskId = useStore((state) => state.selectedTaskId);
  const isTaskDetailOpen = useStore((state) => state.isTaskDetailOpen);
  const searchQuery = useStore((state) => state.searchQuery);
  const filterStatus = useStore((state) => state.filterStatus);
  const filterPriority = useStore((state) => state.filterPriority);
  const sortBy = useStore((state) => state.sortBy);
  const sortOrder = useStore((state) => state.sortOrder);
  const isDragging = useStore((state) => state.isDragging);
  const hiddenColumns = useStore((state) => state.hiddenColumns);
  const groupByParentTask = useStore((state) => state.groupByParentTask);
  
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setSelectedTaskId = useStore((state) => state.setSelectedTaskId);
  const setTaskDetailOpen = useStore((state) => state.setTaskDetailOpen);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const setFilterStatus = useStore((state) => state.setFilterStatus);
  const setFilterPriority = useStore((state) => state.setFilterPriority);
  const setSortBy = useStore((state) => state.setSortBy);
  const setSortOrder = useStore((state) => state.setSortOrder);
  const setIsDragging = useStore((state) => state.setIsDragging);
  const resetFilters = useStore((state) => state.resetFilters);
  const toggleColumnVisibility = useStore((state) => state.toggleColumnVisibility);
  const setHiddenColumns = useStore((state) => state.setHiddenColumns);
  const setGroupByParentTask = useStore((state) => state.setGroupByParentTask);
  
  return {
    // State
    isSidebarOpen,
    currentView,
    selectedTaskId,
    isTaskDetailOpen,
    searchQuery,
    filterStatus,
    filterPriority,
    sortBy,
    sortOrder,
    isDragging,
    hiddenColumns,
    groupByParentTask,
    // Actions
    toggleSidebar,
    setSidebarOpen,
    setCurrentView,
    setSelectedTaskId,
    setTaskDetailOpen,
    setSearchQuery,
    setFilterStatus,
    setFilterPriority,
    setSortBy,
    setSortOrder,
    setIsDragging,
    resetFilters,
    toggleColumnVisibility,
    setHiddenColumns,
    setGroupByParentTask,
  };
};

// Convenience hooks for specific UI features
export const useSidebar = () => {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);
  
  return { isSidebarOpen, toggleSidebar, setSidebarOpen };
};

export const useTaskDetail = () => {
  const selectedTaskId = useStore((state) => state.selectedTaskId);
  const isTaskDetailOpen = useStore((state) => state.isTaskDetailOpen);
  const setSelectedTaskId = useStore((state) => state.setSelectedTaskId);
  const setTaskDetailOpen = useStore((state) => state.setTaskDetailOpen);
  
  return {
    selectedTaskId,
    isTaskDetailOpen,
    setSelectedTaskId,
    setTaskDetailOpen,
  };
};

export const useFilters = () => {
  const searchQuery = useStore((state) => state.searchQuery);
  const filterStatus = useStore((state) => state.filterStatus);
  const filterPriority = useStore((state) => state.filterPriority);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const setFilterStatus = useStore((state) => state.setFilterStatus);
  const setFilterPriority = useStore((state) => state.setFilterPriority);
  const resetFilters = useStore((state) => state.resetFilters);
  
  return {
    searchQuery,
    filterStatus,
    filterPriority,
    setSearchQuery,
    setFilterStatus,
    setFilterPriority,
    resetFilters,
  };
}; 