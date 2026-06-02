import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'zinc' | 'blue' | 'rose' | 'orange' | 'green' | 'violet';

interface ThemeStore {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      accent: 'zinc',
      setAccent: (accent) => {
        const root = window.document.documentElement;
        if (accent === 'zinc') {
          root.removeAttribute('data-accent');
        } else {
          root.setAttribute('data-accent', accent);
        }
        set({ accent });
      },
    }),
    {
      name: 'theme-accent-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const root = window.document.documentElement;
          if (state.accent === 'zinc') {
            root.removeAttribute('data-accent');
          } else {
            root.setAttribute('data-accent', state.accent);
          }
        }
      },
    }
  )
);
