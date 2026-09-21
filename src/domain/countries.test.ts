import { describe, it } from 'node:test';
import assert from 'node:assert';
import { countryName, inferCountryCode } from './countries.js';

describe('countries', () => {
  it('reconhece nome e código no texto da região', () => {
    assert.strictEqual(inferCountryCode('Vale dos Vinhedos, Brasil'), 'BR');
    assert.strictEqual(inferCountryCode('Bourgogne - FR'), 'FR');
    assert.strictEqual(inferCountryCode('Mendoza'), null);
  });

  it('traduz o código para o nome usado na tela', () => {
    assert.strictEqual(countryName('PT'), 'Portugal');
    assert.strictEqual(countryName(null), '');
    assert.strictEqual(countryName('ZZ'), 'ZZ');
  });
});
