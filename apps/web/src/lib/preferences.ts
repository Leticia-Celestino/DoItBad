export type ThemePreference = 'light' | 'dark' | 'system';

export type Preferences = {
  theme: ThemePreference;
  focusMinutes: number;
  soundVolume: number;
  contextualGreeting: boolean;
};

const key = 'doitbad:preferences';
export const preferencesEvent = 'doitbad:preferences-changed';

const defaults: Preferences = {
  theme: 'system',
  focusMinutes: 2,
  soundVolume: 0.25,
  contextualGreeting: true,
};

export function getPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Preferences>;
    const legacyNight = localStorage.getItem('doitbad:night');
    return {
      ...defaults,
      ...saved,
      theme:
        saved.theme === 'light' || saved.theme === 'dark' || saved.theme === 'system'
          ? saved.theme
          : legacyNight === '1'
            ? 'dark'
            : defaults.theme,
      focusMinutes: [2, 5, 10, 15, 25].includes(Number(saved.focusMinutes))
        ? Number(saved.focusMinutes)
        : defaults.focusMinutes,
      soundVolume: Math.min(0.6, Math.max(0, Number(saved.soundVolume ?? defaults.soundVolume))),
      contextualGreeting: saved.contextualGreeting !== false,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(next: Preferences) {
  localStorage.setItem(key, JSON.stringify(next));
  localStorage.setItem('doitbad:night', next.theme === 'dark' ? '1' : '0');
  window.dispatchEvent(new CustomEvent<Preferences>(preferencesEvent, { detail: next }));
}

export function prefersNight(theme: ThemePreference) {
  return (
    theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  );
}
