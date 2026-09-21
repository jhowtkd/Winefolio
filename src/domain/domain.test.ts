import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import { isCalendarDate, isVintage } from './calendar.js';
import { createPreferences } from './preferences.js';

describe('WineEntry v2 Domain Tests', () => {
  it('inicializa novo registro sem notas inventadas', () => {
    const entry = createEntry('test-1', new Date('2026-09-21T12:00:00Z'));
    assert.strictEqual(entry.conclusao.avaliacaoEstrelas, null);
    assert.strictEqual(entry.tipo, null);
    assert.strictEqual(entry.estilo, null);
    assert.strictEqual(entry.olfato.aromas, '');
    assert.strictEqual(entry.evidence.noteAuthoredAt, null);
    assert.strictEqual(entry.revision, 0);
  });

  it('valida safras legítimas e datas do calendário', () => {
    assert.strictEqual(isVintage('N/V'), true);
    assert.strictEqual(isVintage('S/S'), true);
    assert.strictEqual(isVintage('2024'), true);
    assert.strictEqual(isVintage('abc'), false);

    assert.strictEqual(isCalendarDate('2024-02-29'), true); // bissexto
    assert.strictEqual(isCalendarDate('2026-02-29'), false); // não bissexto
    assert.strictEqual(isCalendarDate('2026-09-21'), true);
    assert.strictEqual(isCalendarDate('invalid-date'), false);
  });

  it('respeita preferências legadas sem forçar tema dark em novos usuários', () => {
    assert.strictEqual(createPreferences('dark').theme, 'night');
    assert.strictEqual(createPreferences(null).theme, 'paper');
    assert.strictEqual(createPreferences('light').theme, 'paper');
  });
});
