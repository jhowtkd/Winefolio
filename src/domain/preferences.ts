import type { Preferences } from './wine-entry';

export function createPreferences(legacyTheme: string | null): Preferences {
  return {
    theme: legacyTheme === 'dark' ? 'night' : 'paper',
    textures: true,
    reduceMotion: false,
    showDemo: true,
    demoFavorites: {},
    aiConsentAt: null,
    sheetLevel: 'iniciante',
    seenStampIds: [],
  };
}
