import { describe, it } from 'node:test';
import assert from 'node:assert';
import { motionDataset } from './motion.js';

describe('motionDataset', () => {
  it('pede data-motion=reduce quando o ajuste está ligado', () => {
    assert.strictEqual(motionDataset(true), 'reduce');
  });

  it('remove o atributo quando o ajuste está desligado', () => {
    assert.strictEqual(motionDataset(false), null);
  });
});
