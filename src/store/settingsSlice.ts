import { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { SettingsState } from '@/types/ui';

export interface SettingsSlice extends SettingsState {
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleAutoSave: () => void;
  setAutoSave: (enabled: boolean) => void;
  toggleShowSubtasks: () => void;
  setShowSubtasks: (show: boolean) => void;
  toggleCompactView: () => void;
  setCompactView: (compact: boolean) => void;
  toggleShowDependencies: () => void;
  setShowDependencies: (show: boolean) => void;
  toggleAnimations: () => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const initialSettingsState: SettingsState = {
  theme: 'system',
  autoSave: true,
  showSubtasks: true,
  compactView: false,
  showDependencies: true,
  animationsEnabled: true,
};

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  ...initialSettingsState,
  
  // Actions
  setTheme: (theme) => set({ theme }),
  
  toggleAutoSave: () => set((state) => ({ 
    autoSave: !state.autoSave 
  })),
  
  setAutoSave: (enabled) => set({ 
    autoSave: enabled 
  }),
  
  toggleShowSubtasks: () => set((state) => ({ 
    showSubtasks: !state.showSubtasks 
  })),
  
  setShowSubtasks: (show) => set({ 
    showSubtasks: show 
  }),
  
  toggleCompactView: () => set((state) => ({ 
    compactView: !state.compactView 
  })),
  
  setCompactView: (compact) => set({ 
    compactView: compact 
  }),
  
  toggleShowDependencies: () => set((state) => ({ 
    showDependencies: !state.showDependencies 
  })),
  
  setShowDependencies: (show) => set({ 
    showDependencies: show 
  }),
  
  toggleAnimations: () => set((state) => ({ 
    animationsEnabled: !state.animationsEnabled 
  })),
  
  setAnimationsEnabled: (enabled) => set({ 
    animationsEnabled: enabled 
  }),
  
  resetSettings: () => set(initialSettingsState),
}); 