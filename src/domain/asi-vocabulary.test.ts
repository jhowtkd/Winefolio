import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as vocabulary from './asi-vocabulary.js';
import { CORE_COLOURS, FAULTS, NOSE_FAULTS, SUBSTYLE_GROUPS, vinificationFor, type AsiOption } from './asi-vocabulary.js';
import { AROMA_GROUPS, aromaGroupOf, groupAromas } from './aroma-catalog.js';

const lists = (Object.entries(vocabulary) as Array<[string, unknown]>).filter(
  (entry): entry is [string, readonly AsiOption[]] =>
    Array.isArray(entry[1]) && typeof (entry[1] as any)[0]?.code === 'string'
);

describe('vocabulário ASI', () => {
  it('toda opção tem código, português e inglês', () => {
    assert.ok(lists.length > 20);
    for (const [name, list] of lists) {
      for (const option of list) {
        assert.ok(option.code && option.pt && option.en, `${name}: ${JSON.stringify(option)}`);
      }
    }
  });

  it('não repete código dentro de uma lista', () => {
    for (const [name, list] of lists) {
      const codes = list.map((option) => option.code);
      assert.strictEqual(new Set(codes).size, codes.length, name);
    }
  });

  it('tem as cores oficiais: 7 para branco, 5 para rosé, 5 para tinto, do jovem ao evoluído', () => {
    assert.deepStrictEqual(
      CORE_COLOURS.branco.map((c) => c.en),
      ['Lemon green', 'Lemon', 'Straw', 'Hay', 'Golden', 'Amber', 'Brown']
    );
    assert.deepStrictEqual(CORE_COLOURS.rose.map((c) => c.en), ['Gris', 'Pink', 'Salmon', 'Orange', 'Onionskin']);
    assert.deepStrictEqual(CORE_COLOURS.tinto.map((c) => c.en), ['Purple', 'Ruby', 'Garnet', 'Tawny', 'Brown']);
    for (const colour of [...CORE_COLOURS.branco, ...CORE_COLOURS.rose, ...CORE_COLOURS.tinto]) {
      assert.match(colour.hex, /^#[0-9A-F]{6}$/i);
    }
  });

  it('tem os 9 defeitos, e dois deles só na boca', () => {
    assert.strictEqual(FAULTS.length, 9);
    assert.strictEqual(NOSE_FAULTS.length, 7);
    assert.ok(!NOSE_FAULTS.some((f) => ['mousiness', 'refermentation'].includes(f.code)));
  });

  it('lista os subestilos de fortificados da ASI', () => {
    assert.deepStrictEqual(
      SUBSTYLE_GROUPS.map((g) => [g.en, g.options.length]),
      [['Sherry', 7], ['Port', 7], ['Madeira', 4], ['Marsala', 3], ['Banyuls', 5]]
    );
  });

  it('filtra o estilo de vinificação pelo tipo', () => {
    assert.ok(vinificationFor('espumante').some((v) => v.code === 'traditional'));
    assert.ok(!vinificationFor('espumante').some((v) => v.code === 'botrytis'));
    assert.ok(vinificationFor('sobremesa').some((v) => v.code === 'botrytis'));
    assert.ok(!vinificationFor('tranquilo').some((v) => v.code === 'tank'));
  });
});

describe('catálogo de aromas', () => {
  it('tem os 18 grupos da ASI', () => {
    assert.strictEqual(AROMA_GROUPS.length, 18);
  });

  it('não põe o mesmo descritor em dois grupos', () => {
    const all = AROMA_GROUPS.flatMap((g) => g.descriptors.map((d) => d.toLowerCase()));
    assert.strictEqual(new Set(all).size, all.length);
  });

  it('dá grupo aos descritores que as fichas antigas já gravavam', () => {
    const old = [
      'Maçã verde', 'Maçã madura', 'Pêra', 'Pêssego', 'Casca de pêssego', 'Damasco', 'Melão',
      'Lima da Pérsia', 'Limão siciliano', 'Casca de limão', 'Abacaxi', 'Maracujá', 'Manga', 'Goiaba',
      'Morango', 'Framboesa', 'Cereja fresca', 'Cereja negra', 'Amora', 'Groselha', 'Mirtilo',
      'Ameixa preta', 'Cassis', 'Frutas em compota', 'Figo maduro', 'Passas',
      'Flores brancas', 'Jasmim', 'Violeta', 'Rosas', 'Grama cortada', 'Pimentão verde', 'Menta / Hortelã',
      'Baunilha', 'Manteiga', 'Carvalho tostado', 'Cravo', 'Canela', 'Pimenta preta', 'Noz-moscada', 'Cedro',
      'Mineral / Pedra molhada', 'Brioche / Pão tostado', 'Chocolate', 'Café', 'Couro', 'Tabaco', 'Mel',
      // fichas de exemplo
      'Frutas escuras', 'Especiarias', 'Cítricos', 'Frutas vermelhas', 'Flores', 'Ervas',
    ];
    for (const descriptor of old) assert.ok(aromaGroupOf(descriptor), descriptor);
  });

  it('agrupa na ordem do catálogo e deixa o descritor livre por último', () => {
    const grouped = groupAromas(['couro', 'Cheiro de casa da avó', 'Morango', 'Framboesa']);
    assert.deepStrictEqual(
      grouped.map((g) => [g.group?.code ?? null, g.descriptors]),
      [['fruity', ['Morango', 'Framboesa']], ['animal', ['couro']], [null, ['Cheiro de casa da avó']]]
    );
  });
});
