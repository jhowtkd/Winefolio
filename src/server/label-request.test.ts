import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseLabelRequest, MAX_IMAGE_BYTES, type LabelRequest } from './label-request.js';

// O tsconfig não usa strict, então `ok` não discrimina a união.
const statusOf = (result: LabelRequest) => ('status' in result ? result.status : null);

describe('parseLabelRequest', () => {
  it('aceita data URL jpeg', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/jpeg;base64,QUJD' });
    assert.deepStrictEqual(result, { ok: true, mimeType: 'image/jpeg', data: 'QUJD' });
  });

  it('recusa corpo sem imagem', () => {
    assert.strictEqual(parseLabelRequest({}).ok, false);
    assert.strictEqual(parseLabelRequest(null).ok, false);
  });

  it('recusa tipo fora da lista', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/svg+xml;base64,QUJD' });
    assert.strictEqual(statusOf(result), 415);
  });

  it('recusa base64 inválido', () => {
    const result = parseLabelRequest({ imageBase64: 'data:image/png;base64,<script>' });
    assert.strictEqual(statusOf(result), 400);
  });

  it('recusa imagem acima do limite', () => {
    const big = 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES + 10) / 3) * 4);
    const result = parseLabelRequest({ imageBase64: `data:image/jpeg;base64,${big}` });
    assert.strictEqual(statusOf(result), 413);
  });
});
