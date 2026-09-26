import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from '../wine-factory.js';
import type { WineEntry } from '../wine-entry.js';
import { buildCtx, evaluate } from './evaluate.js';
import { createRuleMemo, faceValue, runRule, type StampDef } from './rules.js';

let seq = 0;
function entry(date: string, patch: Partial<WineEntry> = {}): WineEntry {
  seq += 1;
  return { ...createEntry(`e${seq}`, new Date(`${date}T12:00:00Z`)), ...patch };
}

function def(id: string, rule: StampDef['rule'], patch: Partial<StampDef> = {}): StampDef {
  return { id, family: 'volume', tier: 1, title: id, motto: id, description: id, glyph: 'book', tone: 'wine', rule, ...patch };
}

const isRed = (e: WineEntry) => e.estilo === 'tinto';
const RED_2 = def('red.2', { kind: 'count', where: isRed, min: 2 });

describe('count', () => {
  it('earnedAt é a data da ficha que cruzou o limite, não a última', () => {
    const entries = [
      entry('2026-03-01', { estilo: 'tinto' }),
      entry('2026-01-10', { estilo: 'tinto' }),
      entry('2026-02-05', { estilo: 'branco' }),
      entry('2026-05-20', { estilo: 'tinto' }),
    ];
    const [state] = evaluate([RED_2], entries);
    assert.strictEqual(state.earned, true);
    assert.strictEqual(state.current, 3);
    assert.strictEqual(state.target, 2);
    assert.strictEqual(state.earnedAt, '2026-03-01');
    assert.strictEqual(state.earnedByEntryId, entries[0].id);
  });

  it('desempata a mesma data por criadoEm', () => {
    const late = entry('2026-04-01', { estilo: 'tinto', criadoEm: 300 });
    const early = entry('2026-04-01', { estilo: 'tinto', criadoEm: 100 });
    const first = entry('2026-01-01', { estilo: 'tinto' });
    const [state] = evaluate([RED_2], [late, early, first]);
    assert.strictEqual(state.earnedByEntryId, early.id);
  });

  it('não depende da ordem de entrada', () => {
    const entries = [entry('2026-01-01', { estilo: 'tinto' }), entry('2026-01-02', { estilo: 'tinto' })];
    assert.deepStrictEqual(evaluate([RED_2], entries), evaluate([RED_2], [...entries].reverse()));
  });

  it('sem alcançar o alvo não tem data', () => {
    const [state] = evaluate([RED_2], [entry('2026-01-01', { estilo: 'tinto' })]);
    assert.strictEqual(state.earned, false);
    assert.strictEqual(state.current, 1);
    assert.strictEqual(state.earnedAt, null);
    assert.strictEqual(state.earnedByEntryId, null);
  });

  it('apagar a ficha que sustentava o marco revoga', () => {
    const entries = [entry('2026-01-01', { estilo: 'tinto' }), entry('2026-01-02', { estilo: 'tinto' })];
    assert.strictEqual(evaluate([RED_2], entries)[0].earned, true);
    assert.strictEqual(evaluate([RED_2], entries.slice(1))[0].earned, false);
  });

  it('níveis do mesmo assunto compartilham uma passada', () => {
    let calls = 0;
    const where = (e: WineEntry) => {
      calls += 1;
      return isRed(e);
    };
    const entries = [entry('2026-01-01', { estilo: 'tinto' }), entry('2026-01-02')];
    const ctx = buildCtx(entries);
    const memo = createRuleMemo();
    runRule({ kind: 'count', where, min: 1 }, ctx, memo);
    runRule({ kind: 'count', where, min: 2 }, ctx, memo);
    assert.strictEqual(calls, 2);
  });
});

describe('distinct', () => {
  const COUNTRIES_3 = def('countries.3', { kind: 'distinct', of: (e) => (e.origin.countryCode ? [e.origin.countryCode] : []), min: 3 });
  const at = (date: string, code: string) => entry(date, { origin: { countryCode: code, region: '' } });

  it('a ficha que trouxe o terceiro valor novo desbloqueia', () => {
    const third = at('2026-03-01', 'FR');
    const entries = [at('2026-01-01', 'PT'), at('2026-02-01', 'PT'), at('2026-02-10', 'AR'), third, at('2026-04-01', 'IT')];
    const [state] = evaluate([COUNTRIES_3], entries);
    assert.strictEqual(state.current, 4);
    assert.strictEqual(state.earnedByEntryId, third.id);
    assert.strictEqual(state.earnedAt, '2026-03-01');
  });
});

describe('coverAll', () => {
  const STYLES = def('styles', { kind: 'coverAll', of: (e) => (e.estilo ? [e.estilo] : []), required: ['branco', 'rose', 'tinto'] });

  it('conta só os valores exigidos e marca a ficha que completou', () => {
    const last = entry('2026-05-01', { estilo: 'rose' });
    const entries = [entry('2026-01-01', { estilo: 'tinto' }), entry('2026-02-01', { estilo: 'branco' }), last];
    const [state] = evaluate([STYLES], entries);
    assert.strictEqual(state.earned, true);
    assert.strictEqual(state.target, 3);
    assert.strictEqual(state.earnedByEntryId, last.id);
    assert.strictEqual(faceValue(STYLES), '3');
  });

  it('mostra o progresso parcial', () => {
    const [state] = evaluate([STYLES], [entry('2026-01-01', { estilo: 'tinto' }), entry('2026-01-02', { estilo: 'tinto' })]);
    assert.strictEqual(state.earned, false);
    assert.strictEqual(state.current, 1);
  });
});

describe('custom', () => {
  it('usa unlockedBy para a data', () => {
    const custom = def('custom', {
      kind: 'custom',
      target: 1,
      progress: (ctx) => {
        const hit = ctx.entries.find((e) => e.favorite);
        return { current: hit ? 1 : 0, unlockedBy: hit?.id };
      },
    }, { face: '★' });
    const fav = entry('2026-06-01', { favorite: true });
    const [state] = evaluate([custom], [entry('2026-01-01'), fav]);
    assert.strictEqual(state.earned, true);
    assert.strictEqual(state.earnedAt, '2026-06-01');
    assert.strictEqual(state.earnedByEntryId, fav.id);
    assert.strictEqual(faceValue(custom), '★');
  });
});

describe('source', () => {
  const ANY = def('any', { kind: 'count', where: () => true, min: 1 });

  it('ficha de exemplo nunca conta como pessoal', () => {
    const demo = entry('2026-01-01', { kind: 'demo', _demo: true });
    const flagged = entry('2026-01-01', { _demo: true });
    assert.strictEqual(evaluate([ANY], [demo, flagged])[0].earned, false);
  });

  it('o modo demo conta só as fichas de exemplo', () => {
    const own = entry('2026-01-01');
    assert.strictEqual(evaluate([ANY], [own], { source: 'demo' })[0].earned, false);
    assert.strictEqual(evaluate([ANY], [own, entry('2026-01-02', { kind: 'demo' })], { source: 'demo' })[0].earned, true);
  });

  it('ficha legada conta', () => {
    assert.strictEqual(evaluate([ANY], [entry('2026-01-01', { kind: 'legacy' })])[0].earned, true);
  });
});
