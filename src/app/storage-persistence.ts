/**
 * Pede ao navegador para não apagar o IndexedDB sob pressão de espaço.
 * Devolve `null` quando o navegador não tem a API.
 */
export async function ensurePersistentStorage(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persisted || !storage.persist) return null;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return null;
  }
}

export async function readPersistentStorage(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persisted) return null;
  try {
    return await storage.persisted();
  } catch {
    return null;
  }
}
