import { describe, it } from 'node:test';
import assert from 'node:assert';
import { adaptLegacy } from './legacy.js';
import { adaptPrototype } from './prototype.js';

describe('Adapters Test', () => {
  it('adapta dados legados v1 com preservação completa', () => {
    const legacyArray = [
      {
        id: 'wine-1',
        produtor: 'Catena Zapata',
        vinho: 'Malbec Argentino',
        safra: '2020',
        uvas: 'Malbec',
        regiaoPais: 'Mendoza - Argentina',
        tipo: 'tranquilo',
        estilo: 'tinto',
        visual: { corNucleoBorda: 'Rubi Intenso', corHex: '#83122D' },
        conclusao: { avaliacaoEstrelas: 5, impressaoFinal: 'Excelente' },
      }
    ];

    const result = adaptLegacy(legacyArray, new Date('2026-09-21T12:00:00Z'));
    assert.strictEqual(result.entries.length, 1);
    const entry = result.entries[0];
    assert.strictEqual(entry.id, 'wine-1');
    assert.strictEqual(entry.produtor, 'Catena Zapata');
    assert.strictEqual(entry.conclusao.avaliacaoEstrelas, 5);
    assert.strictEqual(entry.kind, 'legacy');
    assert.strictEqual(entry.sourceFormat, 'app-v1');
    assert.strictEqual(entry.schemaVersion, 3);
    assert.strictEqual(entry.estilo, 'tinto');
    assert.strictEqual(entry.visual.corHex, '#83122D');
    assert.deepStrictEqual(entry.legacyNotes, { 'visual.coreColour': 'Rubi Intenso' });
  });

  it('adapta backup do protótipo v1 mapeando campos e estilo espumante', () => {
    const prototypeEnvelope = {
      format: 'winefolio-design-prototype',
      version: 1,
      records: [
        {
          id: 'demo-1',
          name: 'Casa do Vento',
          producer: 'Quinta do Vento',
          vintage: '2022',
          style: 'tinto',
          grape: 'Touriga Nacional',
          country: 'PT',
          region: 'Douro',
          note: 'Frutas escuras.',
          rating: 5,
          _demo: false,
        },
        {
          id: 'sparkling-1',
          name: 'Espumante da Serra',
          producer: 'Cave da Serra',
          vintage: 'N/V',
          style: 'espumante',
          grape: 'Chardonnay, Pinot Noir',
          country: 'BR',
          region: 'Serra Gaúcha',
          rating: 4,
          _demo: false,
        }
      ]
    };

    const result = adaptPrototype(prototypeEnvelope, new Date('2026-09-21T12:00:00Z'));
    assert.strictEqual(result.entries.length, 2);

    const first = result.entries[0];
    assert.strictEqual(first.vinho, 'Casa do Vento');
    assert.strictEqual(first.produtor, 'Quinta do Vento');
    assert.strictEqual(first.origin.countryCode, 'PT');
    assert.strictEqual(first.kind, 'personal');

    const sparkling = result.entries[1];
    assert.strictEqual(sparkling.tipo, 'espumante');
    assert.strictEqual(sparkling.estilo, null);
    assert.strictEqual(sparkling.origin.countryCode, 'BR');
  });
});
