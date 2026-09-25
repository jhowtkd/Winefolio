import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LabelAnalysisSchema } from './label-schema.js';

describe('LabelAnalysisSchema', () => {
  it('mantém campos válidos e descarta o que não conhece', () => {
    const parsed = LabelAnalysisSchema.parse({ produtor: 'Quinta', vinho: 'Reserva', extra: 'x' });
    assert.deepStrictEqual(parsed, { produtor: 'Quinta', vinho: 'Reserva' });
  });

  it('descarta só o campo inválido, não a leitura inteira', () => {
    const parsed = LabelAnalysisSchema.parse({ produtor: 'Quinta', corHexSugerida: 'vermelho' });
    assert.strictEqual(parsed.produtor, 'Quinta');
    assert.strictEqual(parsed.corHexSugerida, undefined);
  });

  it('recusa resposta que não é objeto', () => {
    assert.strictEqual(LabelAnalysisSchema.safeParse('texto').success, false);
  });
});
