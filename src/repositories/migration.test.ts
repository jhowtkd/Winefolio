import 'fake-indexeddb/auto';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { openWineDatabase } from './database.js';
import { ASI_MIGRATION_KEY, migrateToAsi } from './migration.js';
import { createWineRepository } from './wine-repository.js';
import { exportBackup, prepareImport } from './transfer.js';
import { createEntry } from '../domain/wine-factory.js';
import { createPreferences } from '../domain/preferences.js';
import { WineEntrySchema } from '../domain/wine-schema.js';

let seq = 0;
const freshDb = () => openWineDatabase(`asi-migration-${++seq}`);

/** O que a versão 2 do app gravava no IndexedDB. */
function storedV2(id: string, kind = 'personal') {
  const { visual, olfato, paladar, conclusao, servico, legacyNotes, skinContact, subestilo, ...rest } = createEntry(id);
  return {
    ...rest,
    schemaVersion: 2,
    kind,
    estilo: 'tinto',
    visual: { limpidez: 'Límpido', transparencia: 'Opaco', intensidade: 'Profunda', corNucleoBorda: 'Rubi', corHex: '#83122D' },
    olfato: { condicao: 'Limpo / Correto', intensidade: 'Média+', aromas: 'Amora', desenvolvimento: 'Em evolução' },
    paladar: {
      docura: 'Seco',
      acidez: 'Alta',
      tanino: 'Alto e sedoso',
      aromasBoca: '',
      corpo: 'Encorpado',
      alcool: 'Alto (14.5%)',
      retrogosto: '',
      persistencia: 'Longa (8s+)',
    },
    conclusao: { guarda: 'Pode guardar 5-8 anos', preco: '', qualidade: 'Excelente', avaliacaoEstrelas: 5, harmonizacao: '', impressaoFinal: 'Potente.' },
    temperaturaServico: '16°C - 18°C',
    decantacao: '1 hora em decanter',
  };
}

describe('migrateToAsi', () => {
  it('converte fichas e rascunho numa transação e marca como feito', async () => {
    const db = await freshDb();
    await db.put('records', storedV2('a') as any);
    const alreadyV3 = createEntry('ja-v3');
    await db.put('records', alreadyV3);
    await db.put('drafts', { id: 'active', entry: storedV2('rascunho') as any, editingId: null, baseRevision: null, updatedAt: 1 }, 'active');

    assert.strictEqual(await migrateToAsi(db), 'migrated');

    const a = await db.get('records', 'a');
    assert.ok(WineEntrySchema.safeParse(a).success);
    assert.strictEqual(a!.paladar.body, 'full');
    assert.strictEqual(a!.paladar.tanninLevel, 'high');
    assert.deepStrictEqual(a!.paladar.tanninQuality, ['silky']);
    assert.strictEqual(a!.conclusao.ageing, '6-9');
    assert.deepStrictEqual(a!.legacyNotes, {
      'visual.transparencia': 'Opaco',
      'olfato.intensity': 'Média+',
      'conclusao.asiQuality': 'Excelente',
      'conclusao.ageing': 'Pode guardar 5-8 anos',
      'servico.decant': '1 hora em decanter',
    });
    assert.deepStrictEqual(await db.get('records', 'ja-v3'), alreadyV3);
    assert.strictEqual((await db.get('drafts', 'active'))!.entry.schemaVersion, 3);
    assert.strictEqual(((await db.get('meta', ASI_MIGRATION_KEY)) as { count: number }).count, 1);
  });

  it('roda uma vez só', async () => {
    const db = await freshDb();
    await db.put('records', storedV2('a') as any);
    await migrateToAsi(db);
    await db.put('records', storedV2('b') as any);
    assert.strictEqual(await migrateToAsi(db), 'already-migrated');
    assert.strictEqual((await db.get('records', 'b'))!.schemaVersion, 2);
  });

  it('põe no nível Avançado quem já tem fichas próprias', async () => {
    const db = await freshDb();
    await db.put('records', storedV2('a') as any);
    await db.put('settings', { ...createPreferences(null), sheetLevel: undefined as any, showDemo: false }, 'preferences');
    await migrateToAsi(db);
    const prefs = await db.get('settings', 'preferences');
    assert.strictEqual(prefs!.sheetLevel, 'avancado');
    assert.strictEqual(prefs!.showDemo, false);
  });

  it('deixa no Iniciante quem só tem fichas de exemplo', async () => {
    const db = await freshDb();
    await db.put('records', storedV2('demo-1', 'demo') as any);
    await migrateToAsi(db);
    const snapshot = await createWineRepository(db).load();
    assert.strictEqual(snapshot.preferences.sheetLevel, 'iniciante');
  });

  it('a leitura converte em memória a ficha que a migração não pegou', async () => {
    const db = await freshDb();
    await db.put('records', storedV2('a') as any);
    const snapshot = await createWineRepository(db).load();
    assert.strictEqual(snapshot.entries[0].schemaVersion, 3);
    assert.strictEqual(snapshot.entries[0].paladar.body, 'full');
  });
});

describe('backup na grade ASI', () => {
  it('exporta na versão 3 e importa de volta sem perda', async () => {
    const db = await freshDb();
    const entry = { ...createEntry('asi'), estilo: 'tinto' as const };
    entry.paladar = { ...entry.paladar, body: 'full', tanninQuality: ['silky', 'fine-grained'] };
    entry.servico = { ...entry.servico, temperature: { min: 16, max: 18 }, glass: 'couped-red' };
    entry.legacyNotes = { 'paladar.acidity': 'Média+' };
    await db.put('records', entry);

    const text = await (await exportBackup(db)).text();
    assert.strictEqual(JSON.parse(text).version, 3);

    const preview = await prepareImport(text, { entries: [], draft: null, preferences: createPreferences(null) });
    assert.deepStrictEqual(preview.warnings, []);
    assert.deepStrictEqual(preview.entries[0], entry);
  });

  it('importa um backup da versão 2 convertendo para a grade', async () => {
    const payload = JSON.stringify({ format: 'winefolio', version: 2, entries: [storedV2('antiga')], photos: [] });
    const preview = await prepareImport(payload, { entries: [], draft: null, preferences: createPreferences(null) });
    assert.strictEqual(preview.entries.length, 1);
    assert.strictEqual(preview.entries[0].schemaVersion, 3);
    assert.deepStrictEqual(preview.entries[0].servico.temperature, { min: 16, max: 18 });
  });
});
