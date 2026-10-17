import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SettingsValue {
  compactMode: boolean;
  reduceMotion: boolean;
  setCompactMode: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [compactMode, setCompactMode] = useLocalStorage('settings-compact-mode', false);
  const [reduceMotion, setReduceMotion] = useLocalStorage('settings-reduce-motion', false);
  const value = useMemo(() => ({ compactMode, reduceMotion, setCompactMode, setReduceMotion }), [compactMode, reduceMotion, setCompactMode, setReduceMotion]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
