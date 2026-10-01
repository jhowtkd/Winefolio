import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from '../wine-factory.js';
import type { WineEntry } from '../wine-entry.js';
import { evaluateStamps } from './evaluate.js';
import { FAMILY_TABS, stampSummary, visibleStamps } from './view.js';
import { newlyEarned, stampNotice } from './novelty.js';
import { stampById } from './catalog.js';

let seq = 0;
function wine(uvas: string, date: string, patch: Partial<WineEntry> = {}): WineEntry {
  seq += 1;
  return { ...createEntry(`v${seq}`, new Date(`${date}T12:00:00Z`)), uvas, ...patch };
}

const chardonnays = (n: number) => Array.from({ length: n }, (_, i) => wine('Chardonnay', `2026-01-${String(i + 1).padStart(2, '0')}`));
const ids = (list: ReturnType<typeof visibleStamps>) => list.map((s) => s.def.id);

describe('visibleStamps', () => {
  it('esconde uva sem ficha e mostra só o próximo nível', () => {
    const shown = ids(visibleStamps(evaluateStamps([wine('Merlot', '2026-01-01')]), 'uva'));
    assert.deepStrictEqual(shown, ['uva.merlot.1']);
  });

  it('mostra os níveis ganhos e o seguinte', () => {
    const shown = ids(visibleStamps(evaluateStamps(chardonnays(10)), 'uva'));
    assert.deepStrictEqual(shown, ['uva.chardonnay.2', 'uva.chardonnay.1', 'uva.chardonnay.3']);
  });

  it('ganhos mais recentes primeiro, bloqueados pelo quanto falta', () => {
    const entries = [...chardonnays(3), wine('Syrah', '2026-02-01'), wine('Syrah', '2026-02-02'), wine('Merlot', '2026-02-03')];
    const shown = ids(visibleStamps(evaluateStamps(entries), 'uva'));
    assert.deepStrictEqual(shown, ['uva.chardonnay.1', 'uva.syrah.1', 'uva.merlot.1', 'uva.chardonnay.2']);
  });

  it('famílias fixas mostram todos os marcos', () => {
    assert.strictEqual(visibleStamps(evaluateStamps([]), 'volume').length, 12);
    assert.strictEqual(visibleStamps(evaluateStamps([]), 'secreto').length, 2);
  });

  it('as abas cobrem todas as famílias menos os legados', () => {
    assert.deepStrictEqual(
      FAMILY_TABS.map((tab) => tab.label),
      ['Uvas', 'Regiões', 'Países', 'Estilos', 'Crítica', 'Técnica', 'Volume', 'Mesa', 'Secretos']
    );
  });

  it('resume ganhos sobre o total', () => {
    const summary = stampSummary(evaluateStamps(chardonnays(3)));
    assert.strictEqual(summary.total, 233);
    assert.ok(summary.earned >= 2);
  });
});

describe('newlyEarned', () => {
  it('anuncia só o que a mudança acabou de ganhar e ninguém viu', () => {
    const before = evaluateStamps(chardonnays(2));
    const after = evaluateStamps(chardonnays(3));
    assert.deepStrictEqual(newlyEarned(before, after, []).map((d) => d.id), ['uva.chardonnay.1']);
    assert.deepStrictEqual(newlyEarned(before, after, ['uva.chardonnay.1']), []);
    assert.deepStrictEqual(newlyEarned(after, after, []), []);
  });
});

describe('stampNotice', () => {
  it('resume um, dois ou vários carimbos', () => {
    const a = stampById('volume.1')!;
    const b = stampById('uva.chardonnay.1')!;
    const c = stampById('pais.3')!;
    assert.strictEqual(stampNotice([]), null);
    assert.strictEqual(stampNotice([b]), 'Novo carimbo no passaporte: Curioso de Chardonnay');
    assert.strictEqual(stampNotice([a, b]), 'Novos carimbos: Primeira taça e Curioso de Chardonnay');
    assert.strictEqual(stampNotice([a, b, c, c]), 'Novos carimbos: Primeira taça, Curioso de Chardonnay e mais 2');
  });
});
