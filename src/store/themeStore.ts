import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'scs_theme';

const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDocument = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
};

export const useThemeStore = create<ThemeStore>((set, get) => {
  const initialTheme = getStoredTheme();
  const initialResolved = initialTheme === 'system' ? getSystemPreference() : initialTheme;

  // Apply immediately on store initialization
  applyThemeToDocument(initialResolved);

  // System preference change listener
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentTheme = get().theme;
      if (currentTheme === 'system') {
        const nextResolved = getSystemPreference();
        applyThemeToDocument(nextResolved);
        set({ resolvedTheme: nextResolved });
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (newTheme: ThemeMode) => {
      const resolved = newTheme === 'system' ? getSystemPreference() : newTheme;
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // ignore
      }
      applyThemeToDocument(resolved);
      set({ theme: newTheme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const { resolvedTheme } = get();
      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },
  };
});
