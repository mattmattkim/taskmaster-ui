import { useStore } from '@/store';

// Hook for all settings
export const useSettings = () => {
  const theme = useStore((state) => state.theme);
  const autoSave = useStore((state) => state.autoSave);
  const showSubtasks = useStore((state) => state.showSubtasks);
  const compactView = useStore((state) => state.compactView);
  const showDependencies = useStore((state) => state.showDependencies);
  const animationsEnabled = useStore((state) => state.animationsEnabled);
  
  const setTheme = useStore((state) => state.setTheme);
  const toggleAutoSave = useStore((state) => state.toggleAutoSave);
  const setAutoSave = useStore((state) => state.setAutoSave);
  const toggleShowSubtasks = useStore((state) => state.toggleShowSubtasks);
  const setShowSubtasks = useStore((state) => state.setShowSubtasks);
  const toggleCompactView = useStore((state) => state.toggleCompactView);
  const setCompactView = useStore((state) => state.setCompactView);
  const toggleShowDependencies = useStore((state) => state.toggleShowDependencies);
  const setShowDependencies = useStore((state) => state.setShowDependencies);
  const toggleAnimations = useStore((state) => state.toggleAnimations);
  const setAnimationsEnabled = useStore((state) => state.setAnimationsEnabled);
  const resetSettings = useStore((state) => state.resetSettings);
  
  return {
    // State
    theme,
    autoSave,
    showSubtasks,
    compactView,
    showDependencies,
    animationsEnabled,
    // Actions
    setTheme,
    toggleAutoSave,
    setAutoSave,
    toggleShowSubtasks,
    setShowSubtasks,
    toggleCompactView,
    setCompactView,
    toggleShowDependencies,
    setShowDependencies,
    toggleAnimations,
    setAnimationsEnabled,
    resetSettings,
  };
};

// Convenience hook for theme settings
export const useThemeSettings = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  
  return { theme, setTheme };
};

// Convenience hook for view settings
export const useViewSettings = () => {
  const showSubtasks = useStore((state) => state.showSubtasks);
  const compactView = useStore((state) => state.compactView);
  const showDependencies = useStore((state) => state.showDependencies);
  const animationsEnabled = useStore((state) => state.animationsEnabled);
  
  const toggleShowSubtasks = useStore((state) => state.toggleShowSubtasks);
  const toggleCompactView = useStore((state) => state.toggleCompactView);
  const toggleShowDependencies = useStore((state) => state.toggleShowDependencies);
  const toggleAnimations = useStore((state) => state.toggleAnimations);
  
  return {
    showSubtasks,
    compactView,
    showDependencies,
    animationsEnabled,
    toggleShowSubtasks,
    toggleCompactView,
    toggleShowDependencies,
    toggleAnimations,
  };
}; 