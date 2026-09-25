import type { WineEntry } from './wine-entry';

export interface BackupStatus {
  lastBackupAt: number | null;
  snoozedUntil: number | null;
}

export const EMPTY_BACKUP_STATUS: BackupStatus = { lastBackupAt: null, snoozedUntil: null };

const DAY = 86_400_000;

export function isBackupDue(status: BackupStatus, entries: WineEntry[], now: number): boolean {
  const own = entries.filter((entry) => entry.kind !== 'demo');
  if (own.length === 0) return false;
  if (status.snoozedUntil !== null && now < status.snoozedUntil) return false;
  if (status.lastBackupAt === null) return own.length >= 3;
  const changed = own.filter((entry) => entry.atualizadoEm > status.lastBackupAt!).length;
  if (changed === 0) return false;
  return changed >= 10 || now - status.lastBackupAt >= 30 * DAY;
}
