import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createTasksSlice, TasksSlice } from './tasksSlice';
import { createUISlice, UISlice } from './uiSlice';
import { createSettingsSlice, SettingsSlice } from './settingsSlice';

export type AppStore = TasksSlice & UISlice & SettingsSlice;

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createTasksSlice(...a),
        ...createUISlice(...a),
        ...createSettingsSlice(...a),
      }),
      {
        name: 'taskmaster-store',
        partialize: (state) => ({
          // Only persist settings
          theme: state.theme,
          autoSave: state.autoSave,
          showSubtasks: state.showSubtasks,
          compactView: state.compactView,
          showDependencies: state.showDependencies,
          animationsEnabled: state.animationsEnabled,
        }),
      }
    ),
    {
      name: 'taskmaster-store',
    }
  )
);
