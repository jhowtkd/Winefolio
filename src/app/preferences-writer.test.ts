import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createPreferencesWriter } from './preferences-writer.js';

interface Prefs {
  theme: string;
  seen: string[];
}

function setup(save: (next: Prefs) => Promise<void>) {
  let current: Prefs = { theme: 'light', seen: [] };
  const published: Prefs[] = [];
  const write = createPreferencesWriter<Prefs>({
    read: () => current,
    save,
    publish: (next) => {
      current = next;
      published.push(next);
    },
  });
  return { write, published, current: () => current };
}

describe('createPreferencesWriter', () => {
  it('grava e só então publica o valor novo', async () => {
    const saved: Prefs[] = [];
    const { write, published, current } = setup(async (next) => {
      assert.strictEqual(current().theme, 'light');
      saved.push(next);
    });
    const next = await write({ theme: 'dark' });
    assert.deepStrictEqual(next, { theme: 'dark', seen: [] });
    assert.deepStrictEqual(saved, [next]);
    assert.deepStrictEqual(published, [next]);
  });

  it('quando a gravação falha, não publica e repassa o erro', async () => {
    const { write, published, current } = setup(async () => {
      throw new Error('quota');
    });
    await assert.rejects(write({ theme: 'dark' }), /quota/);
    assert.deepStrictEqual(published, []);
    assert.deepStrictEqual(current(), { theme: 'light', seen: [] });
  });

  it('uma gravação que falha não entra na seguinte', async () => {
    let calls = 0;
    const saved: Prefs[] = [];
    const { write, current } = setup(async (next) => {
      calls += 1;
      if (calls === 1) throw new Error('quota');
      saved.push(next);
    });
    const first = write({ theme: 'dark' });
    const second = write({ seen: ['a'] });
    await assert.rejects(first, /quota/);
    await second;
    assert.deepStrictEqual(saved, [{ theme: 'light', seen: ['a'] }]);
    assert.deepStrictEqual(current(), { theme: 'light', seen: ['a'] });
  });

  it('duas gravações seguidas não apagam uma à outra', async () => {
    const { write, current } = setup(async () => {});
    await Promise.all([
      write((prefs) => ({ seen: [...prefs.seen, 'a'] })),
      write((prefs) => ({ seen: [...prefs.seen, 'b'] })),
      write({ theme: 'dark' }),
    ]);
    assert.deepStrictEqual(current(), { theme: 'dark', seen: ['a', 'b'] });
  });
});
