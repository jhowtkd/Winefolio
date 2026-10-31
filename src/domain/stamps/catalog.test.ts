import { describe, it } from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { createEntry } from '../wine-factory.js';
import type { WineEntry } from '../wine-entry.js';
import { getDemoWines } from '../../data/demo-wines.js';
import { PASSPORT_ENTRY_RULES, PASSPORT_MILESTONES, passportProgress } from '../passport.js';
import { COUNTRIES } from '../countries.js';
import { ASI_FIELDS, GRID_FIELDS, getPath, setPath } from '../asi-fields.js';
import { AROMA_GROUPS } from '../aroma-catalog.js';
import { coreColoursFor, DISH_STYLE, PAIRING_COMPONENTS, WINE_TYPES } from '../asi-vocabulary.js';
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

  it('Nariz enciclopédico reconhece os 18 grupos escritos sem acento', () => {
    const aromaTags = AROMA_GROUPS.map((group) => group.descriptors[0].normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
    assert.strictEqual(state([entry({ aromaTags })], 'tecnica.grupos').earned, true);
  });

  it('Degustação vertical ignora ano que não é safra', () => {
    const wines = (safras: string[]) => safras.map((safra) => entry({ produtor: 'Casa', vinho: 'Reserva', safra }));
    assert.strictEqual(state(wines(['Lote 1999', 'desde 1890', '2020']), 'tecnica.vertical').earned, false);
    assert.strictEqual(state(wines(['Safra 2018', '2019', 'safra 2020']), 'tecnica.vertical').earned, true);
  });

  it('Degustação vertical não junta vinhos sem produtor pelo nome', () => {
    const unnamed = ['2015', '2016', '2018'].map((safra) => entry({ produtor: '', vinho: 'Reserva', safra }));
    assert.strictEqual(state(unnamed, 'tecnica.vertical').current, 0);
  });

  it('Arqueólogo compara a safra com o ano da degustação', () => {
    assert.strictEqual(state([entry({ safra: '2006' }, '2026-05-01')], 'tecnica.arqueologo').earned, true);
    assert.strictEqual(state([entry({ safra: '2007' }, '2026-05-01')], 'tecnica.arqueologo').earned, false);
    assert.strictEqual(state([entry({ safra: 'N/V' }, '2026-05-01')], 'tecnica.arqueologo').earned, false);
    assert.strictEqual(state([entry({ safra: ' 2006 ' }, '2026-05-01')], 'tecnica.arqueologo').earned, true);
    assert.strictEqual(state([entry({ safra: 'Safra 2006' }, '2026-05-01')], 'tecnica.arqueologo').earned, true);
    for (const safra of ['Fundada em 1855', 'Lote 2006', 'Casa desde 1890, safra 2020', '1990/1995']) {
      assert.strictEqual(state([entry({ safra }, '2026-05-01')], 'tecnica.arqueologo').earned, false, safra);
    }
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

  it('aroma sugerido pela IA sem revisão não conta para os marcos de aromas', () => {
    const olfato = createEntry('x').olfato;
    const names = Array.from({ length: 10 }, (_, i) => `Aroma ${i}`);
    const scanned = entry({
      olfato: { ...olfato, aromas: names.join(', ') },
      aromaTags: names,
      provenance: { 'olfato.aromas': 'ai-unverified' },
    });
    assert.strictEqual(state([scanned], 'tecnica.aromas-10').current, 0);
    assert.strictEqual(state([scanned], 'tecnica.grupos').current, 0);
    const confirmed = { ...scanned, provenance: { 'olfato.aromas': 'user' as const } };
    assert.strictEqual(state([confirmed], 'tecnica.aromas-10').earned, true);
  });

  it('cor com estilo lido pela IA sem revisão não conta como tom novo', () => {
    const visual = createEntry('x').visual;
    const scanned = entry({ estilo: 'branco', visual: { ...visual, coreColour: 'brown' }, provenance: { estilo: 'ai-unverified' } });
    assert.strictEqual(state([scanned], 'tecnica.cor').current, 0);
    const confirmed = { ...scanned, provenance: { estilo: 'user' as const } };
    assert.strictEqual(state([confirmed], 'tecnica.cor').current, 1);
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

  it('avalia 1000 fichas em menos de 50 ms', (t) => {
    const entries = synthetic(1000);
    evaluateStamps(entries);
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      evaluateStamps(entries);
      best = Math.min(best, performance.now() - start);
    }
    assert.ok(best < 50, `levou ${best.toFixed(1)} ms`);
    t.diagnostic(`melhor de três avaliações: ${best.toFixed(2)} ms`);
  });
});

describe('compatibilidade com o Passaporte da main', () => {
  it('contém todos os onze ids, com os mesmos títulos e descrições', () => {
    assert.deepStrictEqual(Object.keys(PASSPORT_ENTRY_RULES).sort(), PASSPORT_MILESTONES.map((m) => m.id).sort());
    for (const milestone of PASSPORT_MILESTONES) {
      const stamp = stampById(milestone.id);
      assert.ok(stamp, milestone.id);
      assert.strictEqual(stamp.title, milestone.title);
      assert.strictEqual(stamp.description, milestone.description);
    }
  });

  it('skinContact sugerido pela IA deixa os dois lados sem o laranja', () => {
    const wine = entry({ estilo: 'branco', skinContact: true, provenance: { skinContact: 'ai-unverified' } });
    assert.strictEqual(state([wine], 'estilo.laranja').earned, false);
    assert.strictEqual(passportProgress([wine]).milestones.find((m) => m.id === 'estilo.laranja')?.earned, false);
  });

  it('mantém earned dos onze ids em fichas isoladas e combinadas, nos modos pessoal e demo', () => {
    const empty = entry();
    const rich = entry({
      tipo: 'espumante', estilo: 'branco', skinContact: true,
      aromaTags: ['Cassis'], origin: { countryCode: 'PT', region: 'Douro' },
      evidence: { ...empty.evidence, revisitedAt: 123 },
      conclusao: { ...empty.conclusao, impressaoFinal: 'Minha impressão.', harmonizacao: 'Queijo', avaliacaoEstrelas: 5, asiQuality: 'very-good' },
    });
    const variants = [
      empty, rich, entry({ tipo: 'fortificado' }),
      entry({ estilo: 'tinto', skinContact: true }),
      entry({ estilo: 'branco', skinContact: false }),
      entry({ aromaTags: [' ', ''], origin: { countryCode: 'other', region: '' } }),
      entry({ servico: { ...empty.servico, dishStyle: 'rustic' } }),
      entry({ conclusao: { ...empty.conclusao, harmonizacao: ' ', avaliacaoEstrelas: 2.5 as never, asiQuality: 'invalid' as never } }),
      ...[0, 1, 3, 4, 6].map((stars) => entry({ conclusao: { ...empty.conclusao, avaliacaoEstrelas: stars as never } })),
      ...[
        'tipo', 'estilo', 'skinContact', 'conclusao.harmonizacao', 'harmonizacao',
        'conclusao.avaliacaoEstrelas', 'avaliacaoEstrelas', 'conclusao.asiQuality', 'asiQuality',
        'conclusao.impressaoFinal', 'aromaTags', 'olfato.aromas', 'regiaoPais', 'origin.countryCode',
      ].map((path) => entry({ ...rich, id: `unverified-${path}`, provenance: { [path]: 'ai-unverified' } })),
    ];
    const demos = variants.flatMap((wine) => [
      { ...wine, id: `${wine.id}-kind`, kind: 'demo' as const, _demo: undefined },
      { ...wine, id: `${wine.id}-flag`, kind: 'legacy' as const, _demo: true },
    ]);
    const mixed = [...variants, ...demos];
    for (const records of [...mixed.map((wine) => [wine]), variants, demos, mixed, []]) {
      for (const source of ['personal', 'demo'] as const) {
        const expected = passportProgress(records, source === 'demo' ? 'demo' : 'mine');
        const actual = new Map(evaluateStamps(records, { source }).map((s) => [s.def.id, s.earned]));
        assert.deepStrictEqual(
          expected.milestones.map((m) => [m.id, actual.get(m.id)]),
          expected.milestones.map((m) => [m.id, m.earned]),
          `${source}: ${records.map((wine) => wine.id).join(', ')}`
        );
      }
    }
  });

  it('Memória revisitada e o secreto usam apenas evidence.revisitedAt', () => {
    const edited = Array.from({ length: 5 }, () => entry({ revision: 7, atualizadoEm: 999 }));
    assert.strictEqual(state(edited, 'legado.revisited').earned, false);
    assert.strictEqual(state(edited, 'secreto.revisita').current, 0);
    const revisited = edited.map((wine) => ({ ...wine, evidence: { ...wine.evidence, revisitedAt: 123 } }));
    assert.strictEqual(state([revisited[0]], 'legado.revisited').earned, true);
    assert.strictEqual(state(revisited.slice(1), 'secreto.revisita').earned, false);
    assert.strictEqual(state(revisited, 'secreto.revisita').earned, true);
    assert.strictEqual(state(revisited.map((wine) => ({ ...wine, evidence: { ...wine.evidence, revisitedAt: null } })), 'legado.revisited').earned, false);
  });

  it('separa fichas kind demo e a marca antiga em todo o catálogo', () => {
    const own = entry({ uvas: 'Syrah', origin: { countryCode: 'BR', region: 'Serra Gaúcha' } });
    const demos = [
      entry({ kind: 'demo', _demo: undefined, uvas: 'Chardonnay' }),
      entry({ kind: 'legacy', _demo: true, uvas: 'Chardonnay' }),
    ];
    assert.deepStrictEqual(evaluateStamps([own, ...demos]), evaluateStamps([own]));
    assert.deepStrictEqual(evaluateStamps([own, ...demos], { source: 'demo' }), evaluateStamps(demos, { source: 'demo' }));
    assert.ok(evaluateStamps(demos).every((s) => s.current === 0 && !s.earned));
    assert.ok(evaluateStamps([own], { source: 'demo' }).every((s) => s.current === 0 && !s.earned));
  });

  it('Shiraz e Syrah contam como uma única uva distinta entre fichas e dentro delas', () => {
    const wines = ['Shiraz', 'Syrah', 'Shiraz, Syrah'].map((uvas) => entry({ uvas }));
    assert.strictEqual(state(wines, 'volume.uvas-10').current, 1);
    assert.strictEqual(state(wines, 'uva.syrah.1').current, 3);
  });
});

describe('provenance nos marcos novos', () => {
  const base = createEntry('trusted');
  const rich: Partial<WineEntry> = {
    tipo: 'fortificado', estilo: 'branco', skinContact: true, subestilo: 'port-ruby',
    produtor: 'Quinta X', vinho: 'Reserva', safra: '2000',
    uvas: 'Shiraz', regiaoPais: 'Douro, Portugal', origin: { countryCode: 'PT', region: 'Douro' },
    aromaTags: ['Cassis'], favorite: true,
    visual: { ...base.visual, coreColour: 'brown' },
    olfato: { ...base.olfato, aromas: 'Cassis', faults: ['tca'] },
    paladar: { ...base.paladar, faults: ['tca'] },
    conclusao: { ...base.conclusao, avaliacaoEstrelas: 5, asiQuality: 'very-good', impressaoFinal: 'x'.repeat(280), harmonizacao: 'Queijo', vinification: ['traditional', 'botrytis'], ageing: '15+' },
    servico: { ...base.servico, temperature: { min: 16, max: 18 }, glass: 'sleek-red', decant: 'no', dishStyle: 'rustic', pairingComponents: ['sweetness'] },
  };

  const cases: Array<[string, string[]]> = [
    ['uvas', ['uva.syrah.1', 'volume.uvas-10']],
    ['regiaoPais', ['regiao.douro.1', 'pais.3']],
    ['origin.countryCode', ['pais.3']],
    ['aromaTags', ['tecnica.aromas-10', 'tecnica.grupos']],
    ['olfato.aromas', ['tecnica.aromas-10', 'tecnica.grupos']],
    ['estilo', ['estilo.laranja-5', 'estilo.arco-iris', 'tecnica.cor']],
    ['skinContact', ['estilo.laranja-5', 'estilo.arco-iris']],
    ['tipo', ['estilo.todos-tipos']],
    ['subestilo', ['estilo.porto-trio']],
    ['visual.coreColour', ['tecnica.cor']],
    ['produtor', ['volume.produtores-10', 'tecnica.vertical']],
    ['vinho', ['tecnica.vertical']],
    ['safra', ['tecnica.vertical', 'tecnica.arqueologo']],
    ['dataDegustacao', ['tecnica.arqueologo']],
    ['conclusao.avaliacaoEstrelas', ['critica.cinco-10', 'critica.escala', 'critica.calibrado']],
    ['avaliacaoEstrelas', ['critica.cinco-10', 'critica.escala', 'critica.calibrado']],
    ['conclusao.asiQuality', ['critica.asi-25', 'critica.muito-bom', 'critica.calibrado']],
    ['asiQuality', ['critica.asi-25', 'critica.muito-bom', 'critica.calibrado']],
    ['conclusao.impressaoFinal', ['critica.cronista']],
    ['conclusao.harmonizacao', ['harmonizacao.25']],
    ['conclusao.vinification', ['estilo.tradicional', 'estilo.botrytis']],
    ['conclusao.ageing', ['estilo.guarda']],
    ['servico.temperature', ['tecnica.servico']],
    ['servico.glass', ['tecnica.servico']],
    ['servico.decant', ['tecnica.servico']],
    ['servico.dishStyle', ['harmonizacao.estilos']],
    ['servico.pairingComponents', ['harmonizacao.componentes']],
    ['favorite', ['secreto.favoritos']],
  ];

  for (const [path, ids] of cases) {
    it(`${path} sugerido pela IA não contribui; após revisão contribui`, () => {
      const wines = ['2000', '2001', '2002'].map((safra) => {
        const wine = entry({ ...rich, safra });
        if (path === 'conclusao.harmonizacao') wine.servico = { ...wine.servico, dishStyle: null };
        if (path === 'conclusao.vinification') wine.tipo = 'espumante';
        return wine;
      });
      const unverified = new Map(evaluateStamps(wines.map((wine) => ({ ...wine, provenance: { [path]: 'ai-unverified' } }))).map((s) => [s.def.id, s.current]));
      const confirmed = new Map(evaluateStamps(wines.map((wine) => ({ ...wine, provenance: { [path]: 'user' } }))).map((s) => [s.def.id, s.current]));
      for (const id of ids) {
        assert.strictEqual(unverified.get(id), 0, id);
        assert.ok(confirmed.get(id)! > 0, id);
      }
    });
  }

  it('Método tradicional só conta em espumante com tipo revisado', () => {
    const wine = entry({ ...rich, tipo: 'espumante' });
    assert.ok(state([wine], 'estilo.tradicional').current > 0);
    assert.strictEqual(state([{ ...wine, tipo: 'tranquilo' }], 'estilo.tradicional').current, 0);
    assert.strictEqual(state([{ ...wine, tipo: null }], 'estilo.tradicional').current, 0);
    assert.strictEqual(state([{ ...wine, provenance: { tipo: 'ai-unverified' } }], 'estilo.tradicional').current, 0);
  });

  it('não atribui defeitos sem revisão, mas aceita um defeito confirmado no outro exame', () => {
    const wine = entry({ ...rich, provenance: { 'olfato.faults': 'ai-unverified', 'paladar.faults': 'ai-unverified' } });
    assert.strictEqual(state([wine], 'critica.defeito').earned, false);
    assert.strictEqual(state([{ ...wine, provenance: { 'olfato.faults': 'ai-unverified', 'paladar.faults': 'user' } }], 'critica.defeito').earned, true);
  });

  it('não atribui discordância entre gosto e ASI quando uma das notas não foi revisada', () => {
    const wine = entry({ ...rich, conclusao: { ...rich.conclusao!, asiQuality: 'simple' } });
    assert.strictEqual(state([wine], 'critica.gosto-e-gosto').earned, true);
    for (const path of ['conclusao.avaliacaoEstrelas', 'conclusao.asiQuality']) {
      assert.strictEqual(state([{ ...wine, provenance: { [path]: 'ai-unverified' } }], 'critica.gosto-e-gosto').earned, false);
    }
  });
});

describe('grade e dependências de campos', () => {
  function completeGrid(): WineEntry {
    let wine = entry({ tipo: 'tranquilo', estilo: 'tinto' });
    for (const field of ASI_FIELDS) {
      if (!field.en || (field.applies && !field.applies(wine))) continue;
      const first = field.options?.(wine)[0]?.code;
      const value = {
        single: first, select: first, multi: first ? [first] : [],
        toggle: getPath(wine, field.path), text: '13%', longtext: 'Framboesa',
        temperature: { min: 16, max: 18 }, colour: coreColoursFor(wine.estilo)[0]?.code,
        aromas: ['Framboesa'], stars: 4,
      }[field.kind];
      wine = setPath(wine, field.path, value);
    }
    return wine;
  }

  it('um campo obrigatório ou uma classificação sem revisão impede os três marcos de grade', () => {
    const wine = completeGrid();
    const ids = ['tecnica.grade-1', 'tecnica.grade-10', 'tecnica.grade-50'];
    const paths = [
      ...GRID_FIELDS.filter((field) => !field.applies || field.applies(wine)).map((field) => field.path),
      'tipo', 'estilo', 'skinContact',
    ];
    for (const id of ids) assert.strictEqual(state([wine], id).current, 1, id);
    for (const path of paths) {
      const states = new Map(evaluateStamps([{ ...wine, provenance: { [path]: 'ai-unverified' } }]).map((s) => [s.def.id, s.current]));
      for (const id of ids) assert.strictEqual(states.get(id), 0, `${path}: ${id}`);
    }
  });

  it('não usa estilo ou tipo sem revisão para resolver sinônimos condicionais', () => {
    const wine = entry({ uvas: 'Auxerrois', estilo: 'tinto', tipo: 'fortificado', regiaoPais: 'Porto' });
    assert.strictEqual(state([wine], 'uva.malbec.1').current, 1);
    assert.strictEqual(state([wine], 'regiao.douro.1').current, 1);
    assert.strictEqual(state([{ ...wine, provenance: { estilo: 'ai-unverified' } }], 'uva.malbec.1').current, 0);
    assert.strictEqual(state([{ ...wine, provenance: { tipo: 'ai-unverified' } }], 'regiao.douro.1').current, 0);
  });

  it('região com provenance própria não conta, mas o texto confirmado de regiaoPais conta', () => {
    const wine = entry({ origin: { countryCode: 'PT', region: 'Douro' }, provenance: { 'origin.region': 'ai-unverified' } });
    assert.strictEqual(state([wine], 'regiao.douro.1').earned, false);
    assert.strictEqual(state([{ ...wine, regiaoPais: 'Douro' }], 'regiao.douro.1').earned, true);
  });
});
