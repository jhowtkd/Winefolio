import type { EntryDraft, WineEntry } from './wine-entry';

export const DRAFT_PHOTO_ID = 'draft:active';

export function backupPhotoIds(entries: WineEntry[], draft: EntryDraft | null): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (entry.photoId) ids.add(entry.photoId);
  }
  if (draft) ids.add(DRAFT_PHOTO_ID);
  return ids;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
