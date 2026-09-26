import { describe, it } from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { createEntry } from '../wine-factory.js';
import type { WineEntry } from '../wine-entry.js';
import { getDemoWines } from '../../data/demo-wines.js';
import { COUNTRIES } from '../countries.js';
import { AROMA_GROUPS } from '../aroma-catalog.js';
import { DISH_STYLE, PAIRING_COMPONENTS, WINE_TYPES } from '../asi-vocabulary.js';
import {
  FIXED_STAMPS,
  GRAPE_STAMPS,
  JEREZ_SUBSTYLES,
  LEGACY_STAMPS,
  MADEIRA_SUBSTYLES,
  REGION_STAMPS,
  STAMPS,
  WORLD_TOUR_COUNTRIES,
  stampById,
} from './catalog.js';
import { evaluateStamps } from './evaluate.js';
import { ruleTarget } from './rules.js';

let seq = 0;
function entry(patch: Partial<WineEntry> = {}, date = '2026-01-01'): WineEntry {
  seq += 1;
  return { ...createEntry(`c${seq}`, new Date(`${date}T12:00:00Z`)), ...patch };
}

function earned(entries: WineEntry[]): Set<string> {
  return new Set(evaluateStamps(entries).filter((s) => s.earned).map((s) => s.def.id));
}

function state(entries: WineEntry[], id: string) {
  return evaluateStamps(entries).find((s) => s.def.id === id)!;
}

const from = (code: string, date = '2026-01-01') => entry({ origin: { countryCode: code, region: '' } }, date);

describe('catalog integrity', () => {
  it('tem 233 marcos: 72 de uva, 93 de região, 64 fixos e 4 legados', () => {
    assert.strictEqual(GRAPE_STAMPS.length, 72);
    assert.strictEqual(REGION_STAMPS.length, 93);
    assert.strictEqual(FIXED_STAMPS.length, 64);
    assert.strictEqual(LEGACY_STAMPS.length, 4);
    assert.strictEqual(STAMPS.length, 233);
  });

  it('distribui os fixos por família como a spec', () => {
    const byFamily: Record<string, number> = {};
    for (const stamp of FIXED_STAMPS) byFamily[stamp.family] = (byFamily[stamp.family] ?? 0) + 1;
    assert.deepStrictEqual(byFamily, { pais: 8, estilo: 16, critica: 12, tecnica: 10, volume: 12, harmonizacao: 4, secreto: 2 });
  });

  it('não repete id nem título, inclusive contra os legados', () => {
    const ids = STAMPS.map((s) => s.id);
    const titles = STAMPS.map((s) => s.title);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.deepStrictEqual(titles.filter((t, i) => titles.indexOf(t) !== i), []);
  });

  it('todo marco tem texto, nível e alvo válidos', () => {
    for (const stamp of STAMPS) {
      assert.ok(stamp.title.trim() && stamp.motto.trim() && stamp.description.trim() && stamp.glyph, stamp.id);
      assert.ok([1, 2, 3].includes(stamp.tier), stamp.id);
      assert.ok(ruleTarget(stamp.rule) >= 1, stamp.id);
      assert.strictEqual(stamp.motto, stamp.motto.toLocaleUpperCase('pt-BR'), stamp.id);
      assert.strictEqual(Boolean(stamp.hidden), stamp.family === 'secreto', stamp.id);
    }
  });

  it('gera títulos paramétricos legíveis', () => {
    assert.strictEqual(stampById('uva.chardonnay.2')?.title, 'Explorador dos Chardonnays');
    assert.strictEqual(stampById('uva.chardonnay.1')?.title, 'Curioso de Chardonnay');
    assert.strictEqual(stampById('uva.chardonnay.1')?.motto, '3 FICHAS DE CHARDONNAY');
    assert.strictEqual(stampById('regiao.provence.2')?.title, 'Amante de Provence');
    assert.strictEqual(stampById('regiao.toscana.1')?.title, 'Visitante da Toscana');
    assert.strictEqual(stampById('regiao.douro.3')?.motto, '15 FICHAS DO DOURO');
  });

  it('as listas do vocabulário têm os tamanhos que os títulos prometem', () => {
    assert.strictEqual(WINE_TYPES.length, 6);
    assert.strictEqual(JEREZ_SUBSTYLES.length, 7);
    assert.strictEqual(MADEIRA_SUBSTYLES.length, 4);
    assert.strictEqual(PAIRING_COMPONENTS.length, 7);
    assert.strictEqual(DISH_STYLE.length, 3);
    assert.strictEqual(AROMA_GROUPS.length, 18);
  });

  it('a volta ao mundo fica congelada nos 13 países da lista', () => {
    assert.strictEqual(WORLD_TOUR_COUNTRIES.length, 13);
    const codes = COUNTRIES.map((c) => c.code as string);
    for (const code of WORLD_TOUR_COUNTRIES) assert.ok(codes.includes(code), code);
  });
});

describe('smoke test with the demo wines', () => {
  const personal = getDemoWines(new Date('2026-09-21T12:00:00Z')).map((wine) => ({
    ...wine,
    kind: 'personal' as const,
    _demo: false,
  }));

  it('ganha os marcos de entrada e nenhum de uva', () => {
    const got = earned(personal);
    for (const id of ['volume.1', 'legado.first', 'legado.vocabulary', 'legado.origin', 'pais.3', 'critica.primeira-nota', 'critica.cinco']) {
      assert.ok(got.has(id), id);
    }
    for (const id of ['regiao.douro.1', 'regiao.mendoza.1', 'regiao.provence.1', 'regiao.serra-gaucha.1', 'regiao.alentejo.1']) {
      assert.ok(got.has(id), id);
    }
    assert.deepStrictEqual([...got].filter((id) => id.startsWith('uva.')), []);
    assert.ok(!got.has('legado.revisited'));
  });

  it('as mesmas fichas como exemplo não geram marco pessoal', () => {
    assert.strictEqual(earned(getDemoWines()).size, 0);
    const demo = evaluateStamps(getDemoWines(), { source: 'demo' });
    assert.ok(demo.some((s) => s.earned));
  });
});

describe('fixed rules', () => {
  it('Entre dois mundos pede 10 fichas de cada lado', () => {
    const old = Array.from({ length: 10 }, (_, i) => from('FR', `2026-01-${String(i + 1).padStart(2, '0')}`));
    const fresh = Array.from({ length: 9 }, (_, i) => from('CL', `2026-02-${String(i + 1).padStart(2, '0')}`));
    assert.strictEqual(state([...old, ...fresh], 'pais.dois-mundos').earned, false);
    assert.strictEqual(state([...old, ...fresh], 'pais.dois-mundos').current, 19);
    const last = from('AR', '2026-03-01');
    const done = state([...old, ...fresh, last], 'pais.dois-mundos');
    assert.strictEqual(done.earned, true);
    assert.strictEqual(done.earnedByEntryId, last.id);
  });

  it('Degustação vertical pede o mesmo vinho em três safras', () => {
    const wine = (safra: string, date: string) => entry({ produtor: 'Quinta X', vinho: 'Reserva', safra }, date);
    const three = [wine('2015', '2026-01-01'), wine('2016', '2026-01-02'), wine('2016', '2026-01-03')];
    assert.strictEqual(state(three, 'tecnica.vertical').earned, false);
    const last = wine('Safra 2018', '2026-01-04');
    assert.strictEqual(state([...three, last], 'tecnica.vertical').earnedByEntryId, last.id);
  });

  it('Arqueólogo compara a safra com o ano da degustação', () => {
    assert.strictEqual(state([entry({ safra: '2006' }, '2026-05-01')], 'tecnica.arqueologo').earned, true);
    assert.strictEqual(state([entry({ safra: '2007' }, '2026-05-01')], 'tecnica.arqueologo').earned, false);
    assert.strictEqual(state([entry({ safra: 'N/V' }, '2026-05-01')], 'tecnica.arqueologo').earned, false);
  });

  it('Arco-íris conta o laranja à parte do branco', () => {
    const colours = [
      entry({ estilo: 'branco' }),
      entry({ estilo: 'rose' }),
      entry({ estilo: 'tinto' }),
    ];
    assert.strictEqual(state(colours, 'estilo.arco-iris').current, 3);
    assert.strictEqual(state([...colours, entry({ estilo: 'branco', skinContact: true })], 'estilo.arco-iris').earned, true);
  });

  it('Palato calibrado compara estrelas e qualidade ASI', () => {
    const agree = (stars: 1 | 2 | 3 | 4 | 5, quality: string) =>
      entry({ conclusao: { ...createEntry('x').conclusao, avaliacaoEstrelas: stars, asiQuality: quality as never } });
    const ten = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((s) =>
      agree(s as 1, { 1: 'simple', 2: 'simple', 3: 'acceptable', 4: 'good', 5: 'very-good' }[s]!)
    );
    assert.strictEqual(state(ten, 'critica.calibrado').earned, true);
    assert.strictEqual(state([...ten.slice(1), agree(5, 'simple')], 'critica.calibrado').earned, false);
    assert.strictEqual(state([agree(5, 'simple')], 'critica.gosto-e-gosto').earned, true);
  });

  it('Cais da Ribeira pede Ruby, Tawny e Vintage', () => {
    const port = (subestilo: string) => entry({ tipo: 'fortificado', subestilo: subestilo as never });
    assert.strictEqual(state([port('port-ruby'), port('port-tawny'), port('port-lbv')], 'estilo.porto-trio').earned, false);
    assert.strictEqual(state([port('port-ruby'), port('port-tawny'), port('port-vintage')], 'estilo.porto-trio').earned, true);
  });

  it('campo lido pela IA sem revisão não conta', () => {
    const base = createEntry('x').conclusao;
    const ai = entry({ conclusao: { ...base, harmonizacao: 'queijos' }, provenance: { 'conclusao.harmonizacao': 'ai-unverified' } });
    assert.strictEqual(state([ai], 'harmonizacao.1').earned, false);
    const confirmed = { ...ai, provenance: { 'conclusao.harmonizacao': 'user' as const } };
    assert.strictEqual(state([confirmed], 'harmonizacao.1').earned, true);
    const sparkling = entry({ tipo: 'espumante', provenance: { tipo: 'ai-unverified' } });
    assert.strictEqual(state([sparkling], 'estilo.primeiro-espumante').earned, false);
  });

  it('Origem registrada segue a regra antiga', () => {
    assert.strictEqual(state([from('other')], 'legado.origin').earned, false);
    assert.strictEqual(state([from('GR')], 'legado.origin').earned, true);
  });

  it('país fora da lista conta para distintos, não para a volta ao mundo', () => {
    const three = [from('GR'), from('PT'), from('FR')];
    assert.strictEqual(state(three, 'pais.3').earned, true);
    assert.strictEqual(state(three, 'pais.todos').current, 2);
  });
});

describe('purity and speed', () => {
  function synthetic(n: number): WineEntry[] {
    const grapes = ['Chardonnay', 'Syrah, Grenache', 'Malbec 80%, Cabernet Franc 20%', 'Touriga Nacional e Tinta Roriz', 'Baga'];
    const regions = ['Mendoza', 'Douro', 'Pauillac', 'Côtes du Rhône', 'Serra Gaúcha', 'Chianti Classico'];
    const codes = ['AR', 'PT', 'FR', 'FR', 'BR', 'IT'];
    const styles = ['tinto', 'branco', 'rose'] as const;
    return Array.from({ length: n }, (_, i) => {
      const base = createEntry(`p${i}`, new Date(Date.UTC(2020, 0, 1 + (i % 2000))));
      return {
        ...base,
        produtor: `Produtor ${i % 70}`,
        vinho: `Vinho ${i % 40}`,
        safra: String(1995 + (i % 30)),
        uvas: grapes[i % grapes.length],
        regiaoPais: regions[i % regions.length],
        origin: { countryCode: codes[i % codes.length], region: regions[i % regions.length] },
        estilo: styles[i % 3],
        tipo: i % 11 === 0 ? 'espumante' : 'tranquilo',
        aromaTags: [`Aroma ${i % 60}`, 'Framboesa'],
        favorite: i % 13 === 0,
        conclusao: { ...base.conclusao, avaliacaoEstrelas: ((i % 5) + 1) as 1, impressaoFinal: 'x'.repeat(i % 300) },
      };
    });
  }

  it('mesmas fichas, mesmo resultado', () => {
    const entries = synthetic(200);
    const pick = (list: ReturnType<typeof evaluateStamps>) => list.map(({ def, ...rest }) => ({ id: def.id, ...rest }));
    assert.deepStrictEqual(pick(evaluateStamps(entries)), pick(evaluateStamps([...entries].reverse())));
  });

  it('avalia 1000 fichas em menos de 50 ms', () => {
    const entries = synthetic(1000);
    evaluateStamps(entries);
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      evaluateStamps(entries);
      best = Math.min(best, performance.now() - start);
    }
    assert.ok(best < 50, `levou ${best.toFixed(1)} ms`);
  });
});
