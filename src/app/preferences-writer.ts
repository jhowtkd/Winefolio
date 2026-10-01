/** Valores novos, ou uma função que os calcula a partir do valor mais recente. */
export type PreferencesChange<T> = Partial<T> | ((current: T) => Partial<T>);

interface PreferencesWriterOptions<T> {
  read: () => T;
  save: (next: T) => Promise<void>;
  publish: (next: T) => void;
}

/**
 * Grava preferências uma de cada vez, sempre a partir do valor mais recente, para duas gravações
 * seguidas não apagarem uma à outra. Só publica o que foi gravado: se o armazenamento recusa, a
 * tela continua com o valor anterior e o erro volta para quem chamou.
 */
export function createPreferencesWriter<T extends object>({
  read,
  save,
  publish,
}: PreferencesWriterOptions<T>): (change: PreferencesChange<T>) => Promise<T> {
  let queue: Promise<unknown> = Promise.resolve();

  return (change) => {
    const run = async (): Promise<T> => {
      const current = read();
      const next: T = { ...current, ...(typeof change === 'function' ? change(current) : change) };
      await save(next);
      publish(next);
      return next;
    };
    const result = queue.then(run);
    queue = result.catch(() => undefined);
    return result;
  };
}
