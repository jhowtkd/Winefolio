import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { isBackupDue, EMPTY_BACKUP_STATUS } from './backup-reminder.js';

const DAY = 86_400_000;

function personal(id: string, updatedAt: number) {
  const entry = createEntry(id);
  entry.kind = 'personal';
  entry.atualizadoEm = updatedAt;
  return entry;
}

describe('isBackupDue', () => {
  it('não lembra sem ficha pessoal', () => {
    const demo = createEntry('d');
    demo.kind = 'demo';
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, [demo, demo, demo], 0), false);
  });

  it('lembra a partir de 3 fichas quando nunca houve backup', () => {
    const two = [personal('a', 1), personal('b', 1)];
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, two, 10), false);
    assert.strictEqual(isBackupDue(EMPTY_BACKUP_STATUS, [...two, personal('c', 1)], 10), true);
  });

  it('lembra depois de 30 dias só se algo mudou', () => {
    const status = { lastBackupAt: 0, snoozedUntil: null };
    assert.strictEqual(isBackupDue(status, [personal('a', 0)], 31 * DAY), false);
    assert.strictEqual(isBackupDue(status, [personal('a', DAY)], 31 * DAY), true);
    assert.strictEqual(isBackupDue(status, [personal('a', DAY)], 5 * DAY), false);
  });

  it('lembra com 10 fichas mudadas mesmo antes de 30 dias', () => {
    const status = { lastBackupAt: 0, snoozedUntil: null };
    const changed = Array.from({ length: 10 }, (_, i) => personal(`e${i}`, DAY));
    assert.strictEqual(isBackupDue(status, changed, 2 * DAY), true);
  });

  it('respeita o adiamento', () => {
    const status = { lastBackupAt: null, snoozedUntil: 7 * DAY };
    const three = [personal('a', 1), personal('b', 1), personal('c', 1)];
    assert.strictEqual(isBackupDue(status, three, DAY), false);
    assert.strictEqual(isBackupDue(status, three, 8 * DAY), true);
  });
});
