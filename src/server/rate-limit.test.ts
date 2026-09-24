import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('bloqueia depois do máximo e libera quando a janela passa', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    assert.strictEqual(limiter.hit('ip', 0).allowed, true);
    assert.strictEqual(limiter.hit('ip', 1_000).allowed, true);
    const blocked = limiter.hit('ip', 2_000);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.retryAfterSeconds, 58);
    assert.strictEqual(limiter.hit('ip', 61_000).allowed, true);
  });

  it('conta cada chave separada', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    assert.strictEqual(limiter.hit('a', 0).allowed, true);
    assert.strictEqual(limiter.hit('b', 0).allowed, true);
  });
});
