import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from '../wine-factory.js';
import type { WineEntry } from '../wine-entry.js';
import { GRAPES } from './grape-catalog.js';
import { REGIONS } from './region-catalog.js';
import {
  aliasTable,
  countryOf,
  fold,
  grapeKeysOf,
  grapesOf,
  regionsOf,
  splitGrapeText,
  trusted,
} from './normalize.js';

function entry(patch: Partial<WineEntry> = {}): WineEntry {
  return { ...createEntry('e1', new Date('2026-09-20T12:00:00Z')), ...patch };
}

const grapes = (uvas: string, patch: Partial<WineEntry> = {}) => grapesOf(entry({ uvas, ...patch }));
const regions = (regiaoPais: string, patch: Partial<WineEntry> = {}) =>
  regionsOf(entry({ regiaoPais, origin: { countryCode: null, region: regiaoPais }, ...patch }));

describe('fold', () => {
  it('ignora acento, caixa e pontuação', () => {
    assert.strictEqual(fold('Côtes-du-Rhône'), 'cotes du rhone');
    assert.strictEqual(fold('  Saint-Émilion, Grand Cru. '), 'saint emilion grand cru');
    assert.strictEqual(fold('Spätburgunder'), 'spatburgunder');
  });
});

describe('splitGrapeText', () => {
  it('corta por vírgula, barra, mais, e comercial e " e ", sem percentuais', () => {
    assert.deepStrictEqual(splitGrapeText('Chardonnay 85%, Pinot Noir 15%'), ['chardonnay', 'pinot noir']);
    assert.deepStrictEqual(splitGrapeText('Cabernet Sauvignon (70%), Malbec (30%)'), ['cabernet sauvignon', 'malbec']);
    assert.deepStrictEqual(splitGrapeText('Merlot 85,5% / Syrah 14,5%'), ['merlot', 'syrah']);
    assert.deepStrictEqual(splitGrapeText('Touriga Nacional e Tinta Roriz & Alicante + Baga; Aragonez'), [
      'touriga nacional',
      'tinta roriz',
      'alicante',
      'baga',
      'aragonez',
    ]);
  });

  it('descarta pedaço sem letra', () => {
    assert.deepStrictEqual(splitGrapeText('100%'), []);
    assert.deepStrictEqual(splitGrapeText(''), []);
  });
});

describe('grapesOf', () => {
  it('casa o nome e cada sinônimo do catálogo', () => {
    for (const grape of GRAPES) {
      assert.deepStrictEqual(grapes(grape.label, { estilo: 'tinto' }), [grape.id], grape.label);
      for (const alias of grape.aliases) {
        const text = typeof alias === 'string' ? alias : alias.text;
        assert.deepStrictEqual(grapes(text.toUpperCase(), { estilo: 'tinto' }), [grape.id], text);
      }
    }
  });

  it('não tira Sauvignon Blanc de Cabernet Sauvignon', () => {
    assert.deepStrictEqual(grapes('Cabernet Sauvignon'), ['cabernet-sauvignon']);
    assert.deepStrictEqual(grapes('Cabernet Sauvignon e Sauvignon Blanc'), ['cabernet-sauvignon', 'sauvignon-blanc']);
    assert.deepStrictEqual(grapes('Sauvignon'), ['sauvignon-blanc']);
    assert.deepStrictEqual(grapes('Cabernet S.'), ['cabernet-sauvignon']);
    assert.deepStrictEqual(grapes('Cabernet Franc'), ['cabernet-franc']);
  });

  it('separa corte com percentuais', () => {
    assert.deepStrictEqual(grapes('Chardonnay 85%, Pinot Noir 15%'), ['chardonnay', 'pinot-noir']);
  });

  it('o sinônimo mais longo ganha', () => {
    assert.deepStrictEqual(grapes('Moscato Giallo'), ['moscato']);
    assert.deepStrictEqual(grapes('Pinot Gris'), ['pinot-grigio']);
    assert.deepStrictEqual(grapes('Pinot'), []);
    assert.deepStrictEqual(grapes('Cabernet'), []);
  });

  it('respeita limite de palavra', () => {
    assert.deepStrictEqual(grapes('Côt'), ['malbec']);
    assert.deepStrictEqual(grapes('Côtes'), []);
    assert.deepStrictEqual(grapes('Chard.'), ['chardonnay']);
    assert.deepStrictEqual(grapes('Gewürztraminer'), ['gewurztraminer']);
  });

  it('auxerrois só é Malbec em tinto', () => {
    assert.deepStrictEqual(grapes('Auxerrois', { estilo: 'tinto' }), ['malbec']);
    assert.deepStrictEqual(grapes('Auxerrois', { estilo: 'branco' }), []);
  });

  it('conta a uva uma vez mesmo repetida', () => {
    assert.deepStrictEqual(grapes('Syrah, Shiraz, syrah 10%'), ['syrah']);
  });

  it('não conta uva lida pela IA sem revisão', () => {
    assert.deepStrictEqual(grapes('Chardonnay', { provenance: { uvas: 'ai-unverified' } }), []);
    assert.deepStrictEqual(grapes('Chardonnay', { provenance: { uvas: 'user' } }), ['chardonnay']);
  });
});

describe('grapeKeysOf', () => {
  it('usa o id do catálogo e o texto dobrado para uva fora dele', () => {
    assert.deepStrictEqual(grapeKeysOf(entry({ uvas: 'Shiraz, Baga, BAGA, Syrah' })), ['syrah', 'baga']);
  });
});

describe('regionsOf', () => {
  it('casa o nome e cada sinônimo do catálogo', () => {
    for (const region of REGIONS) {
      const patch: Partial<WineEntry> = { tipo: 'fortificado' };
      assert.deepStrictEqual(regions(region.label, patch), [region.id], region.label);
      for (const alias of region.aliases) {
        const text = typeof alias === 'string' ? alias : alias.text;
        assert.deepStrictEqual(regions(text, patch), [region.id], text);
      }
    }
  });

  it('sub-região conta para a região mãe', () => {
    assert.deepStrictEqual(regions('Pauillac, França'), ['bordeaux']);
    assert.deepStrictEqual(regions('Bandol'), ['provence']);
    assert.deepStrictEqual(regions('Côtes de Provence'), ['provence']);
    assert.deepStrictEqual(regions('Provença'), ['provence']);
    assert.deepStrictEqual(regions('Saint-Émilion Grand Cru'), ['bordeaux']);
  });

  it('Porto só é Douro em fortificado', () => {
    assert.deepStrictEqual(regions('Porto', { tipo: 'fortificado' }), ['douro']);
    assert.deepStrictEqual(regions('Porto', { tipo: 'tranquilo' }), []);
    assert.deepStrictEqual(regions('Porto Alegre, Brasil'), []);
  });

  it('ignora o nome do vinho', () => {
    assert.deepStrictEqual(regionsOf(entry({ vinho: 'Chablis Style', regiaoPais: 'Napa Valley' })), ['napa']);
  });

  it('conta a região uma vez mesmo nos dois campos', () => {
    assert.deepStrictEqual(
      regionsOf(entry({ regiaoPais: 'Mendoza, Argentina', origin: { countryCode: 'AR', region: 'Luján de Cuyo' } })),
      ['mendoza']
    );
  });

  it('não conta região lida pela IA sem revisão', () => {
    assert.deepStrictEqual(regions('Douro', { provenance: { regiaoPais: 'ai-unverified' } }), []);
  });
});

describe('countryOf', () => {
  it('ignora país vazio e "other"', () => {
    assert.strictEqual(countryOf(entry()), null);
    assert.strictEqual(countryOf(entry({ origin: { countryCode: 'other', region: '' } })), null);
    assert.strictEqual(countryOf(entry({ origin: { countryCode: 'PT', region: '' } })), 'PT');
  });

  it('não conta país derivado de região lida pela IA', () => {
    const ai: Partial<WineEntry> = { regiaoPais: 'Douro, Portugal', provenance: { regiaoPais: 'ai-unverified' } };
    assert.strictEqual(countryOf(entry({ ...ai, origin: { countryCode: 'PT', region: 'Douro, Portugal' } })), null);
    assert.strictEqual(countryOf(entry({ ...ai, origin: { countryCode: 'ES', region: 'Douro, Portugal' } })), 'ES');
    assert.strictEqual(
      countryOf(entry({ ...ai, provenance: { regiaoPais: 'user' }, origin: { countryCode: 'PT', region: '' } })),
      'PT'
    );
  });
});

describe('trusted', () => {
  it('só recusa campo marcado como não revisado', () => {
    assert.strictEqual(trusted(entry({ provenance: { uvas: 'ai-unverified' } }), 'uvas'), false);
    assert.strictEqual(trusted(entry({ provenance: { uvas: 'imported-user' } }), 'uvas'), true);
    assert.strictEqual(trusted(entry(), 'uvas'), true);
  });
});

describe('catalog integrity', () => {
  it('tem 24 uvas e 31 regiões', () => {
    assert.strictEqual(GRAPES.length, 24);
    assert.strictEqual(REGIONS.length, 31);
  });

  it('distribui as regiões por país como a spec', () => {
    const byCountry: Record<string, number> = {};
    for (const region of REGIONS) byCountry[region.country] = (byCountry[region.country] ?? 0) + 1;
    assert.deepStrictEqual(byCountry, { FR: 7, IT: 4, ES: 5, PT: 5, AR: 2, CL: 3, BR: 2, US: 1, NZ: 1, ZA: 1 });
  });

  it('não repete id nem sinônimo entre dois itens', () => {
    for (const catalog of [GRAPES, REGIONS]) {
      const ids = catalog.map((item) => item.id);
      assert.strictEqual(new Set(ids).size, ids.length);
      for (const [text, hits] of aliasTable(catalog)) {
        assert.strictEqual(new Set(hits.map((hit) => hit.id)).size, 1, `"${text}" aponta para mais de um id`);
      }
    }
  });
});
