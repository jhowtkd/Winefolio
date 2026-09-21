import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseHash, formatHash } from './navigation.js';

describe('Navigation Hash Sync Test', () => {
  it('faz parse da rota inicial vazia como caderno', () => {
    assert.deepStrictEqual(parseHash(''), { kind: 'journal', tab: 'all' });
    assert.deepStrictEqual(parseHash('#/'), { kind: 'journal', tab: 'all' });
  });

  it('faz parse de rota de nova ficha com template opcional', () => {
    assert.deepStrictEqual(parseHash('#/novo'), { kind: 'new' });
    assert.deepStrictEqual(parseHash('#/novo?from=wine-123'), { kind: 'new', fromTemplateId: 'wine-123' });
  });

  it('faz parse de rota de visualização e edição de ficha', () => {
    assert.deepStrictEqual(parseHash('#/ficha/wine-abc'), { kind: 'entry', id: 'wine-abc', mode: 'view' });
    assert.deepStrictEqual(parseHash('#/ficha/wine-abc/editar'), { kind: 'entry', id: 'wine-abc', mode: 'edit' });
  });

  it('formata rotas de volta para hash URLs idênticas', () => {
    assert.strictEqual(formatHash({ kind: 'journal', tab: 'favorites' }), '#/caderno?aba=favorites');
    assert.strictEqual(formatHash({ kind: 'entry', id: 'wine-456', mode: 'edit' }), '#/ficha/wine-456/editar');
    assert.strictEqual(formatHash({ kind: 'passport' }), '#/passaporte');
    assert.strictEqual(formatHash({ kind: 'palate' }), '#/paladar');
    assert.strictEqual(parseHash('#/passaporte').kind, 'passport');
    assert.strictEqual(parseHash('#/paladar').kind, 'palate');
    assert.strictEqual(formatHash({ kind: 'cellar' }), '#/adega');
    assert.strictEqual(formatHash({ kind: 'stats' }), '#/estatisticas');
    assert.strictEqual(formatHash({ kind: 'settings' }), '#/ajustes');
  });
});
