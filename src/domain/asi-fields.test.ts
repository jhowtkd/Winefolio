import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEntry } from './wine-factory.js';
import {
  ASI_FIELDS,
  displayValue,
  fieldAt,
  isSectionVisible,
  orphanNotes,
  setPath,
  visibleFields,
} from './asi-fields.js';
import type { WineEntry } from './wine-entry.js';

const paths = (entry: WineEntry, section: Parameters<typeof visibleFields>[1], advanced: boolean) =>
  visibleFields(entry, section, advanced).map((f) => f.path);

describe('registro de campos', () => {
  it('todo caminho existe numa ficha nova', () => {
    const entry = createEntry('x') as unknown as Record<string, any>;
    for (const field of ASI_FIELDS) {
      const [head, tail] = field.path.split('.');
      assert.ok(tail ? tail in entry[head] : head in entry, field.path);
    }
  });

  it('o Iniciante mostra só cor, aromas, doçura, corpo, nota e as anotações livres', () => {
    const beginner = ASI_FIELDS.filter((f) => f.tier === 'iniciante').map((f) => f.path);
    assert.deepStrictEqual(beginner, [
      'visual.coreColour',
      'aromaTags',
      'paladar.sweetness',
      'paladar.body',
      'conclusao.avaliacaoEstrelas',
      'conclusao.harmonizacao',
      'conclusao.impressaoFinal',
    ]);
  });
});

describe('visibilidade', () => {
  it('o Iniciante esconde o Serviço e os campos avançados vazios', () => {
    const entry = createEntry('x');
    assert.deepStrictEqual(paths(entry, 'visual', false), ['visual.coreColour']);
    assert.deepStrictEqual(paths(entry, 'paladar', false), ['paladar.sweetness', 'paladar.body']);
    assert.strictEqual(isSectionVisible(entry, 'servico', false), false);
    assert.strictEqual(isSectionVisible(entry, 'servico', true), true);
  });

  it('campo avançado já preenchido aparece no Iniciante', () => {
    const entry = setPath(createEntry('x'), 'paladar.acidity', 'high');
    assert.ok(paths(entry, 'paladar', false).includes('paladar.acidity'));
  });

  it('campo com nota anterior à grade aparece no Iniciante', () => {
    const entry = { ...createEntry('x'), legacyNotes: { 'servico.temperature': 'Bem gelado' } };
    assert.strictEqual(isSectionVisible(entry, 'servico', false), true);
    assert.deepStrictEqual(paths(entry, 'servico', false), ['servico.temperature']);
  });

  it('esconde tanino em branco, a não ser com contato com as cascas', () => {
    const white = { ...createEntry('x'), estilo: 'branco' as const };
    assert.ok(!paths(white, 'paladar', true).includes('paladar.tanninLevel'));
    assert.ok(paths({ ...white, skinContact: true }, 'paladar', true).includes('paladar.tanninLevel'));
    assert.ok(paths({ ...white, estilo: 'tinto' }, 'paladar', true).includes('paladar.tanninLevel'));
  });

  it('mostra borbulhas só em espumante, subestilo só em fortificado e defeitos só se defeituoso', () => {
    const entry = createEntry('x');
    assert.ok(!paths(entry, 'paladar', true).includes('paladar.sparkle'));
    assert.ok(paths({ ...entry, tipo: 'espumante' }, 'paladar', true).includes('paladar.sparkle'));
    assert.ok(!paths(entry, 'geral', true).includes('subestilo'));
    assert.ok(paths({ ...entry, tipo: 'fortificado' }, 'geral', true).includes('subestilo'));
    assert.ok(!paths(entry, 'olfato', true).includes('olfato.faults'));
    assert.ok(paths(setPath(entry, 'olfato.condition', 'faulty'), 'olfato', true).includes('olfato.faults'));
  });
});

describe('setPath', () => {
  it('não muta a ficha e tira a nota antiga quando a pessoa escolhe', () => {
    const entry = { ...createEntry('x'), legacyNotes: { 'paladar.acidity': 'Média+', 'visual.perlage': 'Fina' } };
    const next = setPath(entry, 'paladar.acidity', 'high');
    assert.strictEqual(entry.paladar.acidity, null);
    assert.strictEqual(next.paladar.acidity, 'high');
    assert.deepStrictEqual(next.legacyNotes, { 'visual.perlage': 'Fina' });
  });

  it('limpar o campo mantém a nota', () => {
    const entry = { ...createEntry('x'), legacyNotes: { 'paladar.acidity': 'Média+' } };
    assert.deepStrictEqual(setPath(entry, 'paladar.acidity', null).legacyNotes, { 'paladar.acidity': 'Média+' });
  });
});

describe('displayValue', () => {
  it('mostra o termo em português e o da ASI em inglês', () => {
    const entry = { ...setPath(createEntry('x'), 'paladar.tanninQuality', ['silky', 'integrated']), estilo: 'tinto' as const };
    assert.deepStrictEqual(displayValue(entry, fieldAt('paladar.tanninQuality')!), [
      { pt: 'Sedosos', en: 'Silky' },
      { pt: 'Integrados', en: 'Integrated' },
    ]);
    const red = setPath(entry, 'visual.coreColour', 'brown');
    assert.deepStrictEqual(displayValue(red, fieldAt('visual.coreColour')!), [{ pt: 'Marrom', en: 'Brown' }]);
    const served = setPath(entry, 'servico.temperature', { min: 16, max: 18 });
    assert.deepStrictEqual(displayValue(served, fieldAt('servico.temperature')!), [{ pt: '16 a 18 °C' }]);
    assert.strictEqual(displayValue(entry, fieldAt('paladar.body')!), null);
  });

  it('separa as notas que não têm campo na grade', () => {
    const entry = { ...createEntry('x'), legacyNotes: { 'visual.transparencia': 'Opaco', 'paladar.acidity': 'Média+' } };
    assert.deepStrictEqual(orphanNotes(entry, 'visual'), [{ path: 'visual.transparencia', pt: 'Transparência', text: 'Opaco' }]);
    assert.deepStrictEqual(orphanNotes(entry, 'paladar'), []);
  });
});
