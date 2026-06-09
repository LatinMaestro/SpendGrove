"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultUserSettings,
  normaliseUserSettings,
  parseStoredUserSettings,
  settingsStorageKey,
  type UserPreferenceSettings,
} from "@/lib/settings";

type SettingsUpdate = Partial<Pick<UserPreferenceSettings, "simpleMode" | "analyticsOptOut" | "onboardingComplete">>;

type SettingsContextValue = {
  settings: UserPreferenceSettings;
  isReady: boolean;
  updateSettings: (update: SettingsUpdate) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState<UserPreferenceSettings>(defaultUserSettings);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSettings(parseStoredUserSettings(window.localStorage.getItem(settingsStorageKey)));
    setIsReady(true);
  }, []);

  const updateSettings = useCallback((update: SettingsUpdate) => {
    setSettings((currentSettings) => {
      const nextSettings = normaliseUserSettings({ ...currentSettings, ...update });
      window.localStorage.setItem(settingsStorageKey, JSON.stringify(nextSettings));
      return nextSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    window.localStorage.removeItem(settingsStorageKey);
    setSettings(defaultUserSettings);
  }, []);

  const contextValue = useMemo(
    () => ({ settings, isReady, updateSettings, resetSettings }),
    [isReady, resetSettings, settings, updateSettings],
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useUserSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useUserSettings must be used inside SettingsProvider.");
  }

  return context;
}
