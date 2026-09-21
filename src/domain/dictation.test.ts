import { describe, it } from 'node:test';
import assert from 'node:assert';
import { appendDictation } from './dictation.js';

describe('appendDictation', () => {
  it('junta o trecho ao texto com um espaço', () => {
    assert.strictEqual(appendDictation('Fruta madura', 'e tanino fino'), 'Fruta madura e tanino fino');
  });

  it('ignora trecho vazio e não duplica espaço', () => {
    assert.strictEqual(appendDictation('Fruta madura ', ' '), 'Fruta madura');
    assert.strictEqual(appendDictation('', 'Começo'), 'Começo');
  });
});
